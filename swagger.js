const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Swagger definition
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CSE 341 Final Project API",
      version: "1.0.0",
      description: "Complete REST API with JWT authentication, contacts, events, users, and RSVPs management",
      contact: {
        name: "Your Team Name",
        email: "team@example.com",
        url: "https://github.com/yourteam/final-project"
      },
      license: {
        name: "ISC",
        url: "https://opensource.org/licenses/ISC"
      }
    },
    servers: [
      {
        url: "http://localhost:8080",
        description: "Development server"
      },
      {
        url: "https://your-app.onrender.com",
        description: "Production server"
      },
      {
        url: "https://your-app.herokuapp.com",
        description: "Staging server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token here"
        },
        sessionAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
          description: "Session cookie for authentication"
        }
      },
      schemas: {
        // Contact Schema
        Contact: {
          type: "object",
          required: ["firstName", "lastName", "email", "favoriteColor"],
          properties: {
            _id: {
              type: "string",
              description: "Auto-generated MongoDB ID",
              example: "507f1f77bcf86cd799439011"
            },
            firstName: {
              type: "string",
              description: "Contact's first name",
              example: "John",
              minLength: 1,
              maxLength: 50
            },
            lastName: {
              type: "string",
              description: "Contact's last name",
              example: "Doe",
              minLength: 1,
              maxLength: 50
            },
            email: {
              type: "string",
              format: "email",
              description: "Contact's email address",
              example: "john.doe@example.com",
              unique: true
            },
            phone: {
              type: "string",
              description: "Contact's phone number",
              example: "+1-555-555-5555"
            },
            favoriteColor: {
              type: "string",
              description: "Contact's favorite color",
              example: "Blue"
            },
            birthday: {
              type: "string",
              format: "date",
              description: "Contact's birthday",
              example: "1990-01-01"
            },
            address: {
              type: "string",
              description: "Street address",
              example: "123 Main St"
            },
            city: {
              type: "string",
              description: "City",
              example: "New York"
            },
            state: {
              type: "string",
              description: "State (2-letter code)",
              example: "NY",
              minLength: 2,
              maxLength: 2
            },
            zipCode: {
              type: "string",
              description: "ZIP code",
              example: "10001"
            },
            userId: {
              type: "string",
              description: "User ID who owns this contact",
              example: "507f1f77bcf86cd799439011"
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp"
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp"
            }
          }
        },
        
        // User Schema
        User: {
          type: "object",
          required: ["name", "email"],
          properties: {
            _id: {
              type: "string",
              description: "Auto-generated MongoDB ID"
            },
            name: {
              type: "string",
              description: "User's full name",
              example: "John Doe"
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
              example: "user@example.com"
            },
            password: {
              type: "string",
              format: "password",
              description: "User's password (min 6 characters)",
              minLength: 6,
              writeOnly: true
            },
            googleId: {
              type: "string",
              description: "Google OAuth ID (for OAuth users)"
            },
            role: {
              type: "string",
              enum: ["user", "admin"],
              description: "User role",
              default: "user",
              example: "user"
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp"
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp"
            }
          }
        },
        
        // Event Schema
        Event: {
          type: "object",
          required: ["title", "date", "location"],
          properties: {
            _id: {
              type: "string",
              description: "Auto-generated MongoDB ID"
            },
            title: {
              type: "string",
              description: "Event title",
              example: "Annual Conference 2024",
              minLength: 3,
              maxLength: 200
            },
            description: {
              type: "string",
              description: "Event description",
              example: "Join us for our annual conference featuring great speakers",
              maxLength: 1000
            },
            date: {
              type: "string",
              format: "date-time",
              description: "Event date and time",
              example: "2024-12-25T18:00:00Z"
            },
            location: {
              type: "string",
              description: "Event location",
              example: "Convention Center, New York"
            },
            capacity: {
              type: "integer",
              description: "Maximum number of attendees",
              example: 100,
              minimum: 0,
              maximum: 10000
            },
            createdBy: {
              type: "string",
              description: "User ID who created the event"
            },
            attendees: {
              type: "array",
              description: "List of user IDs attending",
              items: {
                type: "string"
              }
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp"
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp"
            }
          }
        },
        
        // RSVP Schema
        RSVP: {
          type: "object",
          required: ["eventId", "status"],
          properties: {
            _id: {
              type: "string",
              description: "Auto-generated MongoDB ID"
            },
            eventId: {
              type: "string",
              description: "Event ID to RSVP for",
              example: "507f1f77bcf86cd799439011"
            },
            userId: {
              type: "string",
              description: "User ID making the RSVP"
            },
            status: {
              type: "string",
              enum: ["going", "maybe", "not-going", "pending", "confirmed", "cancelled"],
              description: "RSVP status",
              example: "going"
            },
            guests: {
              type: "integer",
              description: "Number of guests accompanying",
              example: 2,
              minimum: 0,
              maximum: 100
            },
            dietaryRestrictions: {
              type: "string",
              description: "Any dietary restrictions",
              example: "Vegetarian, Gluten-free"
            },
            notes: {
              type: "string",
              description: "Additional notes",
              example: "Will arrive late"
            },
            rsvpDate: {
              type: "string",
              format: "date-time",
              description: "When RSVP was submitted"
            }
          }
        },
        
        // Auth Response Schema
        AuthResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Login successful"
            },
            token: {
              type: "string",
              description: "JWT token for authentication",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            },
            user: {
              $ref: "#/components/schemas/User"
            }
          }
        },
        
        // Error Response Schema
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message"
            },
            message: {
              type: "string",
              description: "Detailed error message"
            },
            details: {
              type: "object",
              description: "Validation error details"
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: "Auth",
        description: "Authentication Endpoints"
      },
      {
        name: "Contacts",
        description: "Contact management Endpoints"
      },
      {
        name: "Users",
        description: "User Management Endpoints"
      },
      {
        name: "Events",
        description: "Event Management Endpoints"
      },
      {
        name: "RSVPs",
        description: "RSVP Management Endpoints"
      },
      {
        name: "Health",
        description: "Health Check Endpoints"
      }
    ]
  },
  apis: [
    "./routes/*.js",
    "./routes/contacts.js",
    "./routes/users.js", 
    "./routes/events.js",
    "./routes/rsvps.js",
    "./controllers/*.js",
    "./models/*.js"
  ]
};

// Generate swagger specification
const swaggerSpec = swaggerJsdoc(options);

// Function to setup swagger UI
function setupSwagger(app) {
  // Serve swagger UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "CSE 341 Final Project API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    }
  }));
  
  // Serve swagger JSON
  app.get("/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
  
  console.log("📚 Swagger documentation available at /api-docs");
  console.log("📄 Swagger JSON available at /swagger.json");
}

// Auto-generate swagger.json file (optional - for static file generation)
const fs = require("fs");
const path = require("path");

function generateSwaggerFile() {
  const outputPath = path.join(__dirname, "swagger.json");
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
  console.log(`✅ Swagger specification saved to ${outputPath}`);
}

// Run generation if script is executed directly
if (require.main === module) {
  generateSwaggerFile();
}

module.exports = { swaggerSpec, setupSwagger, generateSwaggerFile };