const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

jest.mock('../models/User');

// Mock passport with proper implementation
jest.mock('passport', () => {
  return {
    use: jest.fn(),
    serializeUser: jest.fn(),
    deserializeUser: jest.fn(),
    initialize: jest.fn(() => (req, res, next) => next()),
    session: jest.fn(() => (req, res, next) => next()),
    authenticate: jest.fn(() => (req, res, next) => next())
  };
});

// Mock the auth middleware
jest.mock('../middleware/auth', () => ({
  isAuthenticated: (req, res, next) => {
    req.user = { 
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin'
    };
    next();
  },
  ensureAuthenticated: (req, res, next) => {
    req.user = { 
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin'
    };
    next();
  },
  ensureAdmin: (req, res, next) => {
    req.user = { 
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin'
    };
    next();
  },
  isAdmin: (req, res, next) => {
    req.user = { 
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin'
    };
    next();
  }
}));

describe('Users API - PUT/PATCH Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /users/:id', () => {
    it('should update a user successfully', async () => {
      const mockUserId = '507f1f77bcf86cd799439011';
      const mockUpdatedUser = {
        _id: mockUserId,
        name: 'Updated Name',
        email: 'updated@example.com',
        age: 30,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUpdatedUser);
      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        age: 30
      };

      const response = await request(app)
        .put(`/users/${mockUserId}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
    });

    it('should return 404 if user not found', async () => {
      // Mock findById to return null (user not found)
      User.findById.mockResolvedValue(null);
      // Also mock findByIdAndUpdate to return null
      User.findByIdAndUpdate.mockResolvedValue(null);
      
      // Mock any validation to pass by providing valid data
      const updateData = {
        name: 'Test User',
        email: 'test@example.com'
      };

      const response = await request(app)
        .put('/users/nonexistentuserid123')
        .send(updateData);

      expect(response.statusCode).toBe(404);
    });

    it('should handle update with findByIdAndUpdate', async () => {
      const mockUserId = '507f1f77bcf86cd799439011';
      const mockUpdatedUser = {
        _id: mockUserId,
        name: 'Direct Update',
        email: 'direct@example.com'
      };

      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      const updateData = {
        name: 'Direct Update',
        email: 'direct@example.com'
      };

      const response = await request(app)
        .put(`/users/${mockUserId}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
    });
  });
});