// tests/contacts.test.js
const request = require('supertest');

// Mock the Contact model BEFORE importing the app
jest.mock('../models/Contact', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn()
}));

const app = require('../server');
const Contact = require('../models/Contact');

describe('Contacts API - GET Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /contacts', () => {
    it('should return all contacts with status 200', async () => {
      const mockContacts = [
        { _id: '1', name: 'Contact 1', email: 'contact1@test.com' },
        { _id: '2', name: 'Contact 2', email: 'contact2@test.com' }
      ];
      
      Contact.find.mockResolvedValue(mockContacts);
      
      const response = await request(app).get('/contacts');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockContacts);
    });

    it('should return 500 when database error occurs', async () => {
      Contact.find.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/contacts');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /contacts/:id', () => {
    it('should return a single contact with status 200', async () => {
      const mockContact = { _id: '123', name: 'Test Contact', email: 'test@test.com' };
      
      Contact.findById.mockResolvedValue(mockContact);
      
      const response = await request(app).get('/contacts/123');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockContact);
    });

    it('should return 404 when contact not found', async () => {
      Contact.findById.mockResolvedValue(null);
      
      const response = await request(app).get('/contacts/999');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Contact not found');
    });
  });
});