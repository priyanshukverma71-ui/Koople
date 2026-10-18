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
 * Generate an image using Google GenAI Imagen 3 model
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

  const ai = getAiClient();
  const modelName = 'imagen-3.0-generate-002';

  try {
    const config = {
      numberOfImages: 1,
    };

    if (aspectRatio) {
      config.aspectRatio = aspectRatio;
    }

    const response = await ai.models.generateImages({
      model: modelName,
      prompt: prompt.trim(),
      config,
    });

    // Check if response contains generated images
    if (!response || !response.generatedImages || response.generatedImages.length === 0) {
      const error = new Error(
        'No image was generated. The prompt may have violated safety policies or been blocked by content filters.'
      );
      error.statusCode = 400;
      throw error;
    }

    const generatedImage = response.generatedImages[0];
    const imageBytes = generatedImage?.image?.imageBytes;

    if (!imageBytes) {
      const error = new Error('Image data was not returned by the Gemini service.');
      error.statusCode = 502;
      throw error;
    }

    return {
      imageData: imageBytes, // base64 string
      mimeType: 'image/png',
      model: modelName,
    };
  } catch (err) {
    // If it's already an error with a specific statusCode, rethrow it
    if (err.statusCode) {
      throw err;
    }

    const errMsg = (err.message || '').toLowerCase();
    const status = err.status || err.code;

    // Quota and Rate Limit errors
    if (status === 429 || errMsg.includes('quota') || errMsg.includes('rate limit') || errMsg.includes('resource_exhausted')) {
      const error = new Error('KOOPLE image generation quota exceeded. Please wait a moment and try again.');
      error.statusCode = 429;
      throw error;
    }

    // Authentication / Permission errors
    if (status === 401 || status === 403 || errMsg.includes('unauthenticated') || errMsg.includes('permission_denied') || errMsg.includes('api key')) {
      const error = new Error('KOOPLE Gemini API authentication failed. Please verify the server GEMINI_API_KEY configuration.');
      error.statusCode = 503;
      throw error;
    }

    // Safety and Content Block errors
    if (errMsg.includes('safety') || errMsg.includes('blocked') || errMsg.includes('policy')) {
      const error = new Error('The prompt was blocked by safety filters. Please adjust your prompt and try again.');
      error.statusCode = 400;
      throw error;
    }

    // Network / Timeout errors
    if (errMsg.includes('econnrefused') || errMsg.includes('etimedout') || errMsg.includes('enotfound') || errMsg.includes('fetch failed')) {
      const error = new Error('Network error while connecting to Google Gemini image service. Please try again later.');
      error.statusCode = 504;
      throw error;
    }

    // Default server error
    const genericError = new Error(`Image generation failed: ${err.message || 'Unknown error'}`);
    genericError.statusCode = 500;
    throw genericError;
  }
}
