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
const applicationsRoutes = require('./api/internal/routes/applications');
const tenantsRoutes = require('./api/internal/routes/tenants');
const auditRoutes = require('./api/internal/routes/audit');
const metricsRoutes = require('./api/internal/routes/metrics');
const entitlementsRoutes = require('./api/internal/routes/entitlements');
const brandingRoutes = require('./api/internal/routes/branding');
const communicationRoutes = require('./api/internal/routes/communication');
const transcriptionPlansRoutes = require('./api/internal/routes/transcription-plans');
const tenantTranscriptionConfigRoutes = require('./api/internal/routes/tenant-transcription-config');
const tenantTranscriptionUsageRoutes = require('./api/internal/routes/tenant-transcription-usage');
const jobsRoutes = require('./api/internal/routes/jobs');

// TQ App Routes
const tqRoutes = require('./api/tq');
const publicQuoteAccessRoutes = require('./api/tq/routes/public-quote-access');
const deepgramWebhookRoutes = require('./api/tq/routes/deepgram-webhook');

// Public routes (no auth required)
const tenantLookupRoutes = require('./api/internal/public/tenant-lookup');
const publicViewRoutes = require('./api/public/routes/view');

// Website routes (public, no auth)
const websiteContactRoutes = require('./api/website/routes/contact');

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();

// Configuration
const INTERNAL_PREFIX = process.env.INTERNAL_API_PREFIX || '/internal/api/v1';
const DOCS_PATH = process.env.INTERNAL_DOCS_PATH || '/docs/internal';
const ENABLE_DOCS = process.env.ENABLE_INTERNAL_DOCS === 'true';
const DISABLE_DOCS_AUTH = process.env.DISABLE_DOCS_AUTH === 'true'; // Allow public access to docs
const ENABLE_HELMET = process.env.ENABLE_HELMET === 'true';
const ADMIN_PANEL_ORIGIN = process.env.ADMIN_PANEL_ORIGIN;
const HUB_ORIGIN = process.env.HUB_ORIGIN || 'http://localhost:3003';
const TQ_ORIGIN = process.env.TQ_ORIGIN || 'http://localhost:3005';
const WEBSITE_ORIGIN = process.env.WEBSITE_ORIGIN || 'http://localhost:3006';

// Global middlewares
if (ENABLE_HELMET) {
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to prevent Swagger UI conflicts
  }));
}

// Increase body size limit to 1GB for Deepgram webhooks with word_timestamps
// Deepgram accepts audio files up to 1GB, which can generate very large webhook payloads
// with extensive word-level timestamp data for long recordings (hours of audio)
app.use(express.json({ limit: '1gb' }));

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
    
    // Allow hub origin
    if (origin === HUB_ORIGIN) {
      return callback(null, true);
    }

    // Allow TQ origin
    if (origin === TQ_ORIGIN) {
      return callback(null, true);
    }

    // Allow Website origin
    if (origin === WEBSITE_ORIGIN) {
      return callback(null, true);
    }

    // Allow production website domain
    if (origin === 'https://livocare.ai' || origin === 'https://www.livocare.ai') {
      return callback(null, true);
    }

    // Block other origins
    console.error(`❌ [CORS] Blocked origin: ${origin}`);
    console.error(`   Allowed origins: ADMIN_PANEL=${ADMIN_PANEL_ORIGIN}, HUB=${HUB_ORIGIN}, TQ=${TQ_ORIGIN}`);
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

// Public routes (no auth required)
internalRouter.use('/public', tenantLookupRoutes);

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

// Transcription Plans routes (platform-scoped, for internal admins only)
internalRouter.use('/transcription-plans', transcriptionPlansRoutes);

// Tenant Transcription Config routes (platform-scoped, for internal admins only)
internalRouter.use('/tenants', tenantTranscriptionConfigRoutes);

// Audit routes (platform-scoped, for internal admins only)
internalRouter.use('/audit', auditRoutes);

// Metrics routes (platform-scoped, for internal admins only)
internalRouter.use('/metrics', metricsRoutes);

// Jobs routes (platform-scoped, for internal admins only)
internalRouter.use('/jobs', jobsRoutes);

// Configurations routes (platform-scoped, uses authenticated user's tenant)
internalRouter.use('/configurations/branding', brandingRoutes);
internalRouter.use('/configurations/communication', communicationRoutes);
internalRouter.use('/configurations', tenantTranscriptionUsageRoutes); // Transcription usage & config
// Legacy path kept for backward compatibility
internalRouter.use('/configurations/smtp', communicationRoutes);

// Create tenant-scoped router for routes that need tenant context
const tenantScopedRouter = express.Router();
tenantScopedRouter.use(tenantMiddleware, requireAuth);

tenantScopedRouter.use('/users', userRoutes); // Re-enabled for pricing system grant/revoke functionality
tenantScopedRouter.use('/entitlements', entitlementsRoutes);

// TQ App API Routes (require TQ app access)
tenantScopedRouter.use('/tq', requireTranscriptionQuoteAccess(), tqRoutes);

// Mount tenant-scoped routes
internalRouter.use(tenantScopedRouter);

// Mount internal API with CORS
app.use(INTERNAL_PREFIX, cors(internalCorsOptions), internalRouter);

// Mount public API routes (NO authentication required)
app.use('/api/public', cors(internalCorsOptions), publicViewRoutes);

// Mount website API routes (NO authentication required, for contact form etc.)
app.use('/api/website/contact', cors(internalCorsOptions), websiteContactRoutes);

// Mount public quote access route FIRST (NO authentication, NO tenant middleware required)
// This allows patients to access quotes via /api/tq/v1/pq/:accessToken
// IMPORTANT: Must be mounted BEFORE protected TQ routes to avoid tenant middleware
app.use('/api/tq/v1', cors(internalCorsOptions), publicQuoteAccessRoutes);

// Mount Deepgram webhook route (NO authentication, NO tenant middleware required)
// Deepgram is external service that cannot send x-tenant-id header
// IMPORTANT: Must be mounted BEFORE protected TQ routes to avoid tenant middleware
app.use('/api/tq/v1', cors(internalCorsOptions), deepgramWebhookRoutes);

// Mount TQ API Routes at /api/tq/v1
const tqApiRouter = express.Router();
tqApiRouter.use(tenantMiddleware, requireAuth, requireTranscriptionQuoteAccess());
tqApiRouter.use(tqRoutes);

app.use('/api/tq/v1', cors(internalCorsOptions), tqApiRouter);

// ============================================================================
// SWAGGER DOCUMENTATION SETUP
// ============================================================================

// Middleware to block docs access on non-internal domains
const blockDocsOnNonInternalDomain = (req, res, next) => {
  const hostname = req.hostname;

  // Only allow docs on internal.livocare.ai and localhost
  const allowedHosts = ['internal.livocare.ai', 'localhost', '127.0.0.1'];
  const isAllowed = allowedHosts.some(host => hostname === host || hostname.startsWith(host));

  if (!isAllowed) {
    return res.status(404).json({
      error: {
        code: 404,
        message: 'Documentation is not available on this domain'
      }
    });
  }
  next();
};

// Swagger Documentation (Protected by platform role)
if (ENABLE_DOCS) {
  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'LivoCare - Internal Administrative API',
        version: '1.0.0',
        description: 'Internal API for LivoCare team to manage tenants, licenses, and system administration',
      },
      tags: [
        {
          name: 'Auth',
          description: 'Authentication services (platform and tenant)',
          'x-scope': 'mixed'
        },
        {
          name: 'Tenants',
          description: 'Tenant lifecycle management (creation, update, addresses, contacts)',
          'x-scope': 'global'
        },
        {
          name: 'Users',
          description: 'User management and administration',
          'x-scope': 'mixed'
        },
        {
          name: 'Applications',
          description: 'Application catalog and pricing management',
          'x-scope': 'global'
        },
        {
          name: 'Licenses',
          description: 'License management and application access control',
          'x-scope': 'mixed'
        },
        {
          name: 'Transcription Plans',
          description: 'Transcription quota plans management (Basic, VIP)',
          'x-scope': 'global'
        },
        {
          name: 'Transcription Configuration',
          description: 'Tenant transcription quota configuration',
          'x-scope': 'global'
        },
        {
          name: 'Audit',
          description: 'Security audit trails and compliance logging',
          'x-scope': 'global'
        },
        {
          name: 'Metrics',
          description: 'Platform analytics and performance monitoring',
          'x-scope': 'global'
        },
        {
          name: 'Public',
          description: 'Self-service endpoints for end users',
          'x-scope': 'platform'
        }
      ],
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
    apis: [
      'src/server/api/internal/routes/*.js',
      'src/server/api/internal/public/*.js'
    ], // JSDoc comments in route files
  });

  // Swagger UI setup with optional authentication
  const internalSwaggerSetup = swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'LivoCare Internal API Docs',
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });

  if (DISABLE_DOCS_AUTH || process.env.NODE_ENV === 'development') {
    // No authentication required
    app.use(DOCS_PATH, blockDocsOnNonInternalDomain, swaggerUi.serveFiles(swaggerSpec, {}), internalSwaggerSetup);
  } else {
    // Production: Require authentication and platform role
    app.use(
      DOCS_PATH,
      blockDocsOnNonInternalDomain,
      requireAuth,
      requirePlatformRole('internal_admin'), // Only internal admins can access documentation
      swaggerUi.serveFiles(swaggerSpec, {}),
      internalSwaggerSetup
    );
  }
}

// ============================================================================
// TQ API SWAGGER DOCUMENTATION
// ============================================================================

if (ENABLE_DOCS) {
  const tqSwaggerSpec = swaggerJsdoc({
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
          url: '/api/tq/v1',
          description: 'TQ API'
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
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    apis: ['./src/server/api/tq/routes/*.js']
  });

  const tqSwaggerSetup = swaggerUi.setup(tqSwaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TQ API Documentation',
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });

  if (DISABLE_DOCS_AUTH || process.env.NODE_ENV === 'development') {
    // No authentication required
    app.use('/docs/tq', blockDocsOnNonInternalDomain, swaggerUi.serveFiles(tqSwaggerSpec, {}), tqSwaggerSetup);
  } else {
    // Production: Require authentication and platform role
    app.use(
      '/docs/tq',
      blockDocsOnNonInternalDomain,
      requireAuth,
      requirePlatformRole('internal_admin'),
      swaggerUi.serveFiles(tqSwaggerSpec, {}),
      tqSwaggerSetup
    );
  }

  // Documentation landing page
  const pathModule = require('path');
  const fs = require('fs');
  const docsLandingPath = pathModule.join(__dirname, 'views', 'docs-landing.html');

  app.get('/docs', blockDocsOnNonInternalDomain, (req, res) => {
    res.sendFile(docsLandingPath);
  });
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

// ============================================================================
// STATIC FILE SERVING FOR PRODUCTION (Frontends buildados)
// ============================================================================

const isProduction = process.env.NODE_ENV === 'production';
const pathModule = require('path');

if (isProduction) {
  console.log('🚀 Production mode: Serving static frontend builds');

  // Debug: Check if build directories exist
  const fs = require('fs');
  const adminPath = pathModule.join(__dirname, '../../dist/client');
  const hubPath = pathModule.join(__dirname, '../../dist/hub');
  const tqPath = pathModule.join(__dirname, '../../dist/tq');

  console.log('📂 Checking build directories:');
  console.log('  /admin:', fs.existsSync(adminPath) ? '✓ EXISTS' : '✗ NOT FOUND');
  console.log('  /hub:', fs.existsSync(hubPath) ? '✓ EXISTS' : '✗ NOT FOUND');
  console.log('  /tq:', fs.existsSync(tqPath) ? '✓ EXISTS' : '✗ NOT FOUND');

  // Hostname-based routing middleware
  app.use((req, res, next) => {
    const hostname = req.hostname;

    // Internal Admin subdomain
    if (hostname === 'internal.livocare.ai') {
      // Serve admin at root
      if (req.path === '/' || !req.path.startsWith('/api') && !req.path.startsWith('/docs') && !req.path.startsWith('/internal')) {
        return express.static(adminPath)(req, res, () => {
          // SPA fallback
          if (!req.path.startsWith('/api') && !req.path.startsWith('/docs') && !req.path.startsWith('/internal')) {
            res.sendFile(pathModule.join(__dirname, '../../dist/client/index.html'));
          } else {
            next();
          }
        });
      }
    }

    // Hub subdomain
    if (hostname === 'hub.livocare.ai') {
      // Serve hub at root
      if (req.path === '/' || !req.path.startsWith('/api') && !req.path.startsWith('/docs') && !req.path.startsWith('/internal')) {
        return express.static(hubPath)(req, res, () => {
          // SPA fallback
          if (!req.path.startsWith('/api') && !req.path.startsWith('/docs') && !req.path.startsWith('/internal')) {
            res.sendFile(pathModule.join(__dirname, '../../dist/hub/index.html'));
          } else {
            next();
          }
        });
      }
    }

    // TQ subdomain
    if (hostname === 'tq.livocare.ai') {
      // Serve TQ at root
      if (req.path === '/' || !req.path.startsWith('/api') && !req.path.startsWith('/docs') && !req.path.startsWith('/internal')) {
        return express.static(tqPath)(req, res, () => {
          // SPA fallback
          if (!req.path.startsWith('/api') && !req.path.startsWith('/docs') && !req.path.startsWith('/internal')) {
            res.sendFile(pathModule.join(__dirname, '../../dist/tq/index.html'));
          } else {
            next();
          }
        });
      }
    }

    next();
  });

  // Fallback for Railway default URL (path-based routing)
  // Redirect root to admin panel
  app.get('/', (req, res) => {
    res.redirect('/admin');
  });

  // Exact path routes
  app.get('/hub', (req, res) => {
    res.sendFile(pathModule.join(__dirname, '../../dist/hub/index.html'));
  });

  app.get('/tq', (req, res) => {
    res.sendFile(pathModule.join(__dirname, '../../dist/tq/index.html'));
  });

  // Serve static files for each frontend (path-based fallback)
  app.use('/admin', express.static(adminPath));
  app.use('/hub', express.static(hubPath));
  app.use('/tq', express.static(tqPath));

  // SPA fallback for path-based routes
  app.get('/admin/*', (req, res) => {
    res.sendFile(pathModule.join(__dirname, '../../dist/client/index.html'));
  });

  app.get('/hub/*', (req, res) => {
    res.sendFile(pathModule.join(__dirname, '../../dist/hub/index.html'));
  });

  app.get('/tq/*', (req, res) => {
    res.sendFile(pathModule.join(__dirname, '../../dist/tq/index.html'));
  });
} else {
  console.log('💻 Development mode: Use separate Vite servers for frontends');
}

// ============================================================================
// ERROR HANDLERS
// ============================================================================

// 404 handler (only for API routes and non-matched paths)
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 404,
      message: 'Endpoint not found',
    },
  });
});

module.exports = app;
