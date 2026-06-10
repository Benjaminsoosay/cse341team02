const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

jest.mock('../models/User');

describe('Users API - GET Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /