import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'koople_test_jwt_secret_key_1234567890';

// Mock Google Gemini image generation service
const mockImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

vi.mock('../src/services/gemini.js', () => ({
  generateImage: vi.fn(async (prompt, aspectRatio = '1:1') => ({
    imageData: mockImageData,
    mimeType: 'image/png',
    model: 'imagen-3.0-generate-002',
  })),
  getAiClient: vi.fn(),
}));

const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { Generation } = await import('../src/models/Generation.js');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Generation.deleteMany({});
});

// Helper function to create authenticated user and get cookie
async function createTestUser(email = 'creator@koople.ai') {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({
      name: 'Test Creator',
      email,
      password: 'StrongPassword123!',
    });

  return {
    user: res.body.user,
    cookie: res.headers['set-cookie'],
  };
}

describe('Health Endpoint (/api/health)', () => {
  it('should return health status and connected database (200)', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.body).toHaveProperty('timestamp');
  });
});

describe('Image Generation & History Endpoints', () => {
  describe('POST /api/generate-image', () => {
    it('should generate an image and save to database with valid auth and prompt (201)', async () => {
      const { cookie, user } = await createTestUser();

      const res = await request(app)
        .post('/api/generate-image')
        .set('Cookie', cookie)
        .send({
          prompt: 'A futuristic city illuminated by neon lights at night',
          aspectRatio: '16:9',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.generation).toBeDefined();
      expect(res.body.generation.prompt).toBe('A futuristic city illuminated by neon lights at night');
      expect(res.body.generation.aspectRatio).toBe('16:9');
      expect(res.body.generation.imageData).toBe(mockImageData);
      expect(res.body.generation.model).toBe('imagen-3.0-generate-002');
      expect(res.body.generation.mimeType).toBe('image/png');

      // Verify saved in DB
      const dbRecord = await Generation.findById(res.body.generation.id);
      expect(dbRecord).not.toBeNull();
      expect(dbRecord.userId.toString()).toBe(user.id);
    });

    it('should reject image generation without authentication (401)', async () => {
      const res = await request(app)
        .post('/api/generate-image')
        .send({
          prompt: 'A beautiful mountain landscape',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Authentication required/i);
    });

    it('should reject image generation with empty prompt (400)', async () => {
      const { cookie } = await createTestUser();

      const res = await request(app)
        .post('/api/generate-image')
        .set('Cookie', cookie)
        .send({
          prompt: '   ',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/generations', () => {
    it('should retrieve list of user generations without imageData (200)', async () => {
      const { cookie, user } = await createTestUser();

      // Seed 2 generations
      await Generation.create([
        {
          userId: user.id,
          prompt: 'Generation 1',
          model: 'imagen-3.0-generate-002',
          aspectRatio: '1:1',
          imageData: 'fake_base64_data_1',
          mimeType: 'image/png',
        },
        {
          userId: user.id,
          prompt: 'Generation 2',
          model: 'imagen-3.0-generate-002',
          aspectRatio: '1:1',
          imageData: 'fake_base64_data_2',
          mimeType: 'image/png',
        },
      ]);

      const res = await request(app)
        .get('/api/generations')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.generations).toHaveLength(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(2);

      // Verify imageData IS returned in list view (needed for history grid thumbnails)
      expect(res.body.generations[0].imageData).toBeDefined();
      expect(res.body.generations[1].imageData).toBeDefined();
    });

    it('should reject fetching generations without authentication (401)', async () => {
      const res = await request(app).get('/api/generations');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/generations/:id', () => {
    it('should retrieve single generation with full imageData for the owner (200)', async () => {
      const { cookie, user } = await createTestUser();

      const generation = await Generation.create({
        userId: user.id,
        prompt: 'Specific image query',
        model: 'imagen-3.0-generate-002',
        aspectRatio: '1:1',
        imageData: 'full_base64_payload_here',
        mimeType: 'image/png',
      });

      const res = await request(app)
        .get(`/api/generations/${generation._id}`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.generation.id).toBe(generation._id.toString());
      expect(res.body.generation.imageData).toBe('full_base64_payload_here');
    });
  });

  describe('DELETE /api/generations/:id', () => {
    it('should prevent deleting another user generation (403)', async () => {
      const userA = await createTestUser('user_a@koople.ai');
      const userB = await createTestUser('user_b@koople.ai');

      // Generation owned by User A
      const generationA = await Generation.create({
        userId: userA.user.id,
        prompt: 'User A prompt',
        model: 'imagen-3.0-generate-002',
        aspectRatio: '1:1',
        imageData: 'base64_data',
        mimeType: 'image/png',
      });

      // User B attempts to delete User A's generation
      const res = await request(app)
        .delete(`/api/generations/${generationA._id}`)
        .set('Cookie', userB.cookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/permission/i);

      // Ensure item still exists
      const checkExists = await Generation.findById(generationA._id);
      expect(checkExists).not.toBeNull();
    });

    it('should allow owner to delete their own generation (200)', async () => {
      const { cookie, user } = await createTestUser('owner@koople.ai');

      const generation = await Generation.create({
        userId: user.id,
        prompt: 'Owner prompt to delete',
        model: 'imagen-3.0-generate-002',
        aspectRatio: '1:1',
        imageData: 'base64_data',
        mimeType: 'image/png',
      });

      const res = await request(app)
        .delete(`/api/generations/${generation._id}`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/deleted successfully/i);

      // Verify deletion in DB
      const checkDeleted = await Generation.findById(generation._id);
      expect(checkDeleted).toBeNull();
    });
  });
});
