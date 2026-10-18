import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'koople_test_jwt_secret_key_1234567890';

// Import app after setting test environment variables
const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');

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
});

describe('Authentication Endpoints (/api/auth)', () => {
  const validUserData = {
    name: 'Alex Mercer',
    email: 'alex@koople.ai',
    password: 'Password123!',
  };

  describe('POST /api/auth/signup', () => {
    it('should register a new user successfully with valid data (201)', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send(validUserData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe(validUserData.name);
      expect(res.body.user.email).toBe(validUserData.email.toLowerCase());
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).not.toHaveProperty('passwordHash');

      // Verify JWT cookie is set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('token='))).toBe(true);
      expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
    });

    it('should reject signup with duplicate email (409)', async () => {
      // First signup
      await request(app).post('/api/auth/signup').send(validUserData);

      // Duplicate signup attempt
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Another Name',
          email: validUserData.email,
          password: 'Password999!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should reject signup with weak password lacking uppercase, lowercase, or digit (400)', async () => {
      const weakPasswords = [
        'short',          // Less than 8 chars
        'alllowercase1',  // No uppercase
        'ALLUPPERCASE1',  // No lowercase
        'NoDigitsHere!',  // No digit
      ];

      for (const password of weakPasswords) {
        const res = await request(app)
          .post('/api/auth/signup')
          .send({
            name: 'Test User',
            email: `test_${Math.random()}@koople.ai`,
            password,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Pre-create user
      await request(app).post('/api/auth/signup').send(validUserData);
    });

    it('should login successfully with valid credentials (200)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(validUserData.email.toLowerCase());
      expect(res.body.user).not.toHaveProperty('passwordHash');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('token='))).toBe(true);
    });

    it('should reject login with wrong password (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject login with non-existent email (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@koople.ai',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid cookie (200)', async () => {
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send(validUserData);

      const cookie = signupRes.headers['set-cookie'];

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(validUserData.email.toLowerCase());
      expect(res.body.user.name).toBe(validUserData.name);
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject request without authentication cookie (401)', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Authentication required/i);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear authentication cookie on logout (200)', async () => {
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send(validUserData);

      const cookie = signupRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      // Cookie is cleared when value is empty or expires in past
      expect(cookies.some((c) => c.includes('token=;') || c.includes('Expires=Thu, 01 Jan 1970'))).toBe(true);
    });
  });
});
