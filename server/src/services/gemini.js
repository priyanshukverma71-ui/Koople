import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

let aiInstance = null;

export function getAiClient() {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return aiInstance;
}

/**
 * Check if the provided Gemini API key looks like an unconfigured placeholder
 */
function isPlaceholderKey(key) {
  if (!key) return true;
  const lower = key.trim().toLowerCase();
  return (
    lower.includes('your_') ||
    lower.includes('test_or_add') ||
    lower === 'test_gemini_api_key' ||
    lower.length < 15
  );
}

/**
 * Candidate image models available in Google AI Studio
 */
const IMAGE_MODELS = [
  'gemini-2.5-flash-image',
  'gemini-3.1-flash-image',
  'gemini-3.1-flash-lite-image',
  'gemini-3-pro-image',
];

/**
 * Generate an image using Google Gemini Image Generation Models
 * Calls generateContent with responseModalities: ['TEXT', 'IMAGE']
 *
 * @param {string} prompt - Text prompt for image generation
 * @param {string} aspectRatio - Desired aspect ratio ('1:1', '3:4', '4:3', '9:16', '16:9')
 * @returns {Promise<{ imageData: string, mimeType: string, model: string }>}
 */
export async function generateImage(prompt, aspectRatio = '1:1') {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    const error = new Error('A valid prompt is required for image generation');
    error.statusCode = 400;
    throw error;
  }

  if (isPlaceholderKey(env.GEMINI_API_KEY)) {
    const error = new Error(
      'Google Gemini API key is not configured. Please add your GEMINI_API_KEY from Google AI Studio (https://aistudio.google.com/apikey) into server/.env and restart the server.'
    );
    error.statusCode = 503;
    throw error;
  }

  let lastError = null;

  // Try each supported Google AI Studio image model
  for (const modelName of IMAGE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${env.GEMINI_API_KEY}`;
      
      const promptWithRatio = aspectRatio && aspectRatio !== '1:1'
        ? `${prompt.trim()}, ${aspectRatio} aspect ratio`
        : prompt.trim();

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: promptWithRatio,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || '';
        const statusCode = response.status;

        // Quota error with limit: 0 indicates project needs billing linked
        if (statusCode === 429 || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
          const isFreeTierZero = errorMsg.includes('limit: 0');
          const err = new Error(
            isFreeTierZero
              ? 'Google Gemini image generation requires a Google Cloud project with billing enabled in Google AI Studio. Your project quota limit is 0. Please attach billing at https://console.cloud.google.com/billing or upgrade your plan in Google AI Studio.'
              : 'Google Gemini rate limit or quota exceeded. Please wait a moment and try again.'
          );
          err.statusCode = 429;
          throw err;
        }

        if (statusCode === 400 && (errorMsg.includes('API key not valid') || errorMsg.includes('API_KEY_INVALID'))) {
          const err = new Error('Invalid GEMINI_API_KEY. Please verify your Google AI Studio API key in server/.env.');
          err.statusCode = 503;
          throw err;
        }

        if (errorMsg.toLowerCase().includes('safety') || errorMsg.toLowerCase().includes('blocked')) {
          const err = new Error('The prompt was blocked by Gemini safety filters. Please adjust your prompt and try again.');
          err.statusCode = 400;
          throw err;
        }

        const err = new Error(`Gemini service error (${statusCode}): ${errorMsg}`);
        err.statusCode = statusCode >= 400 && statusCode < 500 ? statusCode : 502;
        throw err;
      }

      // Check for inline image data in candidates
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      const imagePart = parts.find((p) => p.inlineData?.data);

      if (imagePart && imagePart.inlineData?.data) {
        return {
          imageData: imagePart.inlineData.data,
          mimeType: imagePart.inlineData.mimeType || 'image/png',
          model: modelName,
        };
      }

      // If text only was returned (e.g. refused to generate), check text response
      const textPart = parts.find((p) => p.text);
      if (textPart && textPart.text) {
        const err = new Error(textPart.text);
        err.statusCode = 400;
        throw err;
      }
    } catch (err) {
      lastError = err;
      // If error is 429 quota or 400 validation, do not loop through other models
      if (err.statusCode === 429 || err.statusCode === 400 || err.statusCode === 503) {
        throw err;
      }
    }
  }

  // Fallback to legacy Imagen 3 predict endpoint or Vertex AI if configured
  try {
    const predictUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict`;
    const response = await fetch(predictUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        instances: [{ prompt: prompt.trim() }],
        parameters: { sampleCount: 1, aspectRatio: aspectRatio || '1:1', outputMimeType: 'image/png' },
      }),
    });
    const data = await response.json();
    const imageBytes = data?.predictions?.[0]?.bytesBase64Encoded;
    if (imageBytes) {
      return {
        imageData: imageBytes,
        mimeType: data.predictions[0].mimeType || 'image/png',
        model: 'imagen-3.0-generate-002',
      };
    }
  } catch {
    // Ignore legacy predict fallback error
  }

  if (lastError) {
    throw lastError;
  }

  const genericError = new Error('No image was returned by the Google Gemini image generation service.');
  genericError.statusCode = 502;
  throw genericError;
}
