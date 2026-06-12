// tests/users.test.js
const request = require('supertest');

// Mock the User model BEFORE importing the app
jest.mock('../models/User', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn()
}));

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  ensureAuthenticated: (req, res, next) => {
    req.user = { _id: '123', name: 'Test User', email: 'test@test.com', role: 'user' };
    req.isAuthenticated = () => true;
    next();
  },
  ensureAdmin: (req, res, next) => {
    req.user = { _id: '123', name: 'Admin', email: 'admin@test.com', role: 'admin' };
    req.isAuthenticated = () => true;
    next();
  }
}));

const app = require('../server');
const User = require('../models/User');

describe('Users API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { _id: '1', name: 'User 1', email: 'user1@test.com' },
        { _id: '2', name: 'User 2', email: 'user2@test.com' }
      ];
      
      User.find.mockResolvedValue(mockUsers);
      
      const response = await request(app).get('/users');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual(mockUsers);
    });

    it('should handle database errors', async () => {
      User.find.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/users');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /users/:id', () => {
    it('should return a user by id', async () => {
      const mockUser = { _id: '123', name: 'Test User', email: 'test@test.com' };
      
      User.findById.mockResolvedValue(mockUser);
      
      const response = await request(app).get('/users/123');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
    });

    it('should return 404 for non-existent user', async () => {
      User.findById.mockResolvedValue(null);
      
      const response = await request(app).get('/users/507f1f77bcf86cd799439011');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const newUser = { name: 'New User', email: 'new@test.com', password: 'password123' };
      const createdUser = { _id: '123', ...newUser };
      
      User.create.mockResolvedValue(createdUser);
      
      const response = await request(app)
        .post('/users')
        .send(newUser);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdUser);
    });
  });

  describe('PUT /users/:id', () => {
    it('should update a user', async () => {
      const updatedUser = { name: 'Updated Name' };
      const result = { _id: '123', name: 'Updated Name', email: 'test@test.com' };
      
      User.findByIdAndUpdate.mockResolvedValue(result);
      
      const response = await request(app)
        .put('/users/123')
        .send(updatedUser);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(result);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user', async () => {
      User.findByIdAndDelete.mockResolvedValue({ _id: '123' });
      
      const response = await request(app).delete('/users/123');
      
      expect(response.status).toBe(200);
    });
  });
});