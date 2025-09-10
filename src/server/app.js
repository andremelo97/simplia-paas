const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Middlewares
const { requireAuth } = require('./infra/middleware/auth');
const { requirePlatformRole } = require('./infra/middleware/platformRole');
const tenantMiddleware = require('./infra/middleware/tenant');
const { requireTranscriptionQuoteAccess } = require('./infra/middleware/appAccess');

// Routes
const authRoutes = require('./api/internal/routes/auth');
const platformAuthRoutes = require('./api/internal/routes/platform-auth');
const userRoutes = require('./api/internal/routes/users');
const tenantUsersRoutes = require('./api/internal/routes/tenant-users');
const applicationsRoutes = require('./api/internal/routes/applications');
const entitlementsRoutes = require('./api/internal/routes/entitlements');
const tenantsRoutes = require('./api/internal/routes/tenants');
const auditRoutes = require('./api/internal/routes/audit');
const metricsRoutes = require('./api/internal/routes/metrics');

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();

// Configuration
const INTERNAL_PREFIX = process.env.INTERNAL_API_PREFIX || '/internal/api/v1';
const DOCS_PATH = process.env.INTERNAL_DOCS_PATH || '/docs/internal';
const ENABLE_DOCS = process.env.ENABLE_INTERNAL_DOCS === 'true';
const ENABLE_HELMET = process.env.ENABLE_HELMET === 'true';
const ADMIN_PANEL_ORIGIN = process.env.ADMIN_PANEL_ORIGIN;

// Global middlewares
if (ENABLE_HELMET) {
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to prevent Swagger UI conflicts
  }));
}

app.use(express.json());

// Health check (outside prefix for monitoring)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// CORS configuration for internal API
const internalCorsOptions = {
  origin(origin, callback) {
    // Allow no origin (curl, Postman, tests)
    if (!origin) return callback(null, true);
    
    // Allow admin panel origin
    if (origin === ADMIN_PANEL_ORIGIN) {
      return callback(null, true);
    }
    
    // Block other origins
    const error = new Error('Not allowed by CORS policy');
    error.status = 403;
    return callback(error);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: '*',
};

// Internal API Router
const internalRouter = express.Router();

// Platform auth routes (no tenant context needed - for Simplia internal team)
internalRouter.use('/platform-auth', platformAuthRoutes);

// Auth routes (tenant-scoped for tenant users)
internalRouter.use('/auth', authRoutes);

// Global platform routes (no tenant context needed)
internalRouter.use('/applications', 
  requireAuth, 
  requirePlatformRole('internal_admin'), 
  applicationsRoutes
);

internalRouter.use('/tenants', tenantsRoutes);

// Tenant-scoped user routes (internal admin only - no tenant middleware needed, uses path param)
internalRouter.use('/', tenantUsersRoutes);

// Audit routes (platform-scoped, for internal admins only)
internalRouter.use('/audit', auditRoutes);

// Metrics routes (platform-scoped, for internal admins only)
internalRouter.use('/metrics', metricsRoutes);

// Create tenant-scoped router for routes that need tenant context
const tenantScopedRouter = express.Router();
tenantScopedRouter.use(tenantMiddleware, requireAuth);

tenantScopedRouter.use('/users', userRoutes); // Re-enabled for pricing system grant/revoke functionality
tenantScopedRouter.use('/entitlements', entitlementsRoutes);

// Example protected TQ routes (will move to separate product APIs later)
tenantScopedRouter.get('/tq/dashboard', requireTranscriptionQuoteAccess(), (req, res) => {
  res.json({
    message: 'Welcome to Transcription Quote Dashboard',
    user: req.user,
    appAccess: req.appAccess,
    license: req.tenantLicense
  });
});

tenantScopedRouter.get('/tq/admin', requireTranscriptionQuoteAccess('admin'), (req, res) => {
  res.json({
    message: 'Transcription Quote Admin Panel',
    user: req.user,
    appAccess: req.appAccess
  });
});

// Mount tenant-scoped routes
internalRouter.use(tenantScopedRouter);

// Mount internal API with CORS
app.use(INTERNAL_PREFIX, cors(internalCorsOptions), internalRouter);

// Swagger Documentation (Protected by platform role)
if (ENABLE_DOCS) {
  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'Simplia PaaS - Internal Administrative API',
        version: '1.0.0',
        description: 'Internal API for Simplia team to manage tenants, licenses, and system administration',
      },
      servers: [
        {
          url: INTERNAL_PREFIX,
          description: 'Internal Administrative API',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'integer' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: ['src/server/api/internal/routes/*.js'], // JSDoc comments in route files
  });

  // Development: Skip auth for local testing
  if (process.env.NODE_ENV !== 'development') {
    // Production: Require authentication and platform role
    app.use(
      DOCS_PATH,
      requireAuth,
      requirePlatformRole('internal_admin'), // Only internal admins can access documentation
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Simplia Internal API Docs',
        swaggerOptions: {
          docExpansion: 'list',
          filter: true,
          showRequestDuration: true,
        },
      })
    );
  } else {
    // Development: No auth required for local testing
    app.use(
      DOCS_PATH,
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Simplia Internal API Docs',
        swaggerOptions: {
          docExpansion: 'list',
          filter: true,
          showRequestDuration: true,
        },
      })
    );
  }
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  
  const status = err.status || 500;
  const message = status < 500 ? err.message : 'Internal Server Error';
  
  res.status(status).json({
    error: {
      code: status,
      message: message,
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 404,
      message: 'Endpoint not found',
    },
  });
});

module.exports = app;