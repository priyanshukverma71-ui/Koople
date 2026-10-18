import mongoose from 'mongoose';

/**
 * Generation Model for KOOPLE AI Image Generation Platform.
 * Note: In local development, generated image bytes are stored directly as base64 in MongoDB.
 * For production environments, imageData should be uploaded to an object store (e.g. AWS S3,
 * Cloudflare R2, or Google Cloud Storage) and a URL reference stored instead.
 */
const generationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    prompt: {
      type: String,
      required: [true, 'Prompt is required'],
      maxlength: [2000, 'Prompt cannot exceed 2000 characters'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model name is required'],
      default: 'imagen-3.0-generate-002',
    },
    aspectRatio: {
      type: String,
      default: '1:1',
      enum: ['1:1', '3:4', '4:3', '9:16', '16:9'],
    },
    imageData: {
      type: String,
      required: [true, 'Image data is required'], // base64 encoded
    },
    mimeType: {
      type: String,
      required: true,
      default: 'image/png',
    },
    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

// Method to format generation for public/client responses
generationSchema.methods.toSafeObject = function (includeImageData = true) {
  const result = {
    id: this._id.toString(),
    prompt: this.prompt,
    model: this.model,
    aspectRatio: this.aspectRatio,
    mimeType: this.mimeType,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };

  if (includeImageData) {
    result.imageData = this.imageData;
  }

  return result;
};

export const Generation = mongoose.model('Generation', generationSchema);
