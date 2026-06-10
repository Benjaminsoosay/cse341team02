const request = require('supertest');
const app = require('../server');
const Event = require('../models/Event');

jest.mock('../models/Event');

describe('Events API - GET Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /events', () => {
    it('should return all events with status 200', async () => {
      const mockEvents = [
        { _id: '1', title: 'Concert', date: '2024-12-01', location: 'Stadium', capacity: 100 }
      ];
      
      Event.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockEvents)
      });
      
      const response = await request(app).get('/events');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEvents);
    });
  });

  describe('GET /events/:id', () => {
    it('should return a single event with status 200', async () => {
      const mockEvent = { _id: '123', title: 'Concert', date: '2024-12-01', location: 'Stadium', capacity: 100 };
      
      Event.findById.mockResolvedValue(mockEvent);
      
      const response = await request(app).get('/events/123');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEvent);
    });

    it('should return 404 when event not found', async () => {
      Event.findById.mockResolvedValue(null);
      
      const response = await request(app).get('/events/999');
      
      expect(response.status).toBe(404);
    });
  });
});