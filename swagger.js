const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Temple API',
    description: 'API documentation for temple routes',
    version: '1.0.0',
  },
  host: 'localhost:8080',
  basePath: '/temples',        // 👈 ADD THIS LINE
  schemes: ['http'],
  consumes: ['application/json'],
  produces: ['application/json'],
  definitions: {
    Temple: {
      temple_id: 'string',
      name: 'string',
      location: 'string',
      description: 'string',
      dedicated: 'string',
      additionalInfo: 'object',
    },
  },
  securityDefinitions: {
    ApiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'apiKey',
    },
  },
  security: [{ ApiKeyAuth: [] }],
};

const outputFile = './swagger.json';
const endpointsFiles = ['./routes/temple.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);