const request = require('supertest');
const app = require('../server');
const Rsvp = require('../models/Rsvp');

jest.mock('../models/Rsvp');

describe('RSVPs API - GET Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /rsvps', () => {
    it('should return all rsvps with status 200', async () => {
      const mockRsvps = [
        { _id: '1', userId: 'user1', eventId: 'event1', status: 'yes' }
      ];
      
      Rsvp.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockRsvps)
        })
      });
      
      const response = await request(app).get('/rsvps');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRsvps);
    });
  });

  describe('GET /rsvps/:id', () => {
    it('should return a single rsvp with status 200', async () => {
      const mockRsvp = { _id: '123', userId: 'user1', eventId: 'event1', status: 'yes' };
      
      Rsvp.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockRsvp)
        })
      });
      
      const response = await request(app).get('/rsvps/123');
      
      expect(response.status).toBe(200);
    });
  });
});