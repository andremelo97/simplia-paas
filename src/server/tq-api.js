// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Middlewares
const tenantMiddleware = require('./infra/middleware/tenant');
const { requireAuth } = require('./infra/middleware/auth');
const { requireTranscriptionQuoteAccess } = require('./infra/middleware/appAccess');

// TQ App Routes
const tqRoutes = require('./api/tq');
const landingPageAccessRoutes = require('./api/tq/routes/landing-page-access');
const deepgramWebhookRoutes = require('./api/tq/routes/deepgram-webhook');

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();

// Configuration
const PORT = process.env.PORT || 3004;
const API_PREFIX = '/api/tq/v1';
const ENABLE_HELMET = process.env.ENABLE_HELMET === 'true';

// Global middlewares
if (ENABLE_HELMET) {
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to prevent Swagger UI conflicts
  }));
}

app.use(express.json());

// CORS configuration for TQ API
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from localhost during development
    const allowedOrigins = [
      'http://localhost:3000', // Generic frontend
      'http://localhost:3001', // Internal API
      'http://localhost:3002', // Internal Admin
      'http://localhost:3003', // Hub
      'http://localhost:3005', // TQ Frontend
    ];

    // Allow requests with no origin (like Deepgram webhooks) or from allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-deepgram-signature']
};

app.use(cors(corsOptions));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TQ API Server is running',
    version: '1.0.0',
    service: 'tq-api',
    port: PORT
  });
});

// Public routes (NO authentication, NO tenant middleware)
// Must be registered BEFORE the authenticated routes
app.use(API_PREFIX, landingPageAccessRoutes);
app.use(API_PREFIX, deepgramWebhookRoutes); // Deepgram webhook callback

// TQ API routes with middlewares
app.use(API_PREFIX,
  tenantMiddleware,
  requireAuth,
  requireTranscriptionQuoteAccess(),
  tqRoutes
);

// Swagger Documentation
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Transcription & Quote (TQ) API',
      version: '1.0.0',
      description: 'REST API for the Transcription & Quote application within LivoCare',
      contact: {
        name: 'LivoCare Team',
        email: 'dev@livocare.ai'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}${API_PREFIX}`,
        description: 'Development TQ API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      parameters: {
        tenantId: {
          name: 'x-tenant-id',
          in: 'header',
          required: true,
          schema: {
            type: 'string',
            pattern: '^[1-9][0-9]*$'
          },
          description: 'Numeric tenant identifier',
          example: '1'
        }
      },
      schemas: {
        Patient: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Patient UUID'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            },
            firstName: {
              type: 'string',
              nullable: true,
              description: 'Patient first name'
            },
            lastName: {
              type: 'string',
              nullable: true,
              description: 'Patient last name'
            },
            email: {
              type: 'string',
              format: 'email',
              nullable: true,
              description: 'Patient email address'
            },
            phone: {
              type: 'string',
              nullable: true,
              description: 'Patient phone number'
            },
            notes: {
              type: 'string',
              nullable: true,
              description: 'Additional notes about the patient'
            }
          }
        },
        Session: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Session UUID'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            },
            patientId: {
              type: 'string',
              format: 'uuid',
              description: 'UUID of the associated patient'
            },
            transcription: {
              type: 'string',
              nullable: true,
              description: 'Session transcription text'
            },
            status: {
              type: 'string',
              enum: ['draft', 'in_progress', 'completed', 'cancelled'],
              description: 'Session status'
            },
            patient: {
              type: 'object',
              nullable: true,
              description: 'Patient data (when includePatient=true)',
              properties: {
                id: { type: 'string', format: 'uuid' },
                firstName: { type: 'string', nullable: true },
                lastName: { type: 'string', nullable: true },
                email: { type: 'string', nullable: true }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type'
            },
            message: {
              type: 'string',
              description: 'Human-readable error message'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/server/api/tq/routes/*.js'] // paths to files containing OpenAPI definitions
});

// Serve Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'TQ API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
  explorer: true
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('TQ API Error:', err);

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 TQ API Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down TQ API server gracefully');
  server.close(() => {
    console.log('TQ API server closed');
    process.exit(0);
  });
});

module.exports = app;