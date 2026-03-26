// ============================================================
// Backend Entry Point - Hono App
// ============================================================
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth.js';
import { eventRoutes } from './routes/events.js';
import { questionRoutes } from './routes/questions.js';
import { examRoutes } from './routes/exam.js';
import { resultRoutes } from './routes/results.js';
import { adminRoutes } from './routes/admin.js';
import { csrfProtection } from './middleware/csrf.js';
import { ensureDbReady } from './middleware/dbReady.js';

const app = new Hono();
console.log('API initialized');

app.use('*', async (c, next) => {
  const requestId = c.req.header('X-Request-Id') || crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-Id', requestId);
  await next();
});

// CORS middleware
app.use('*', async (c, next) => {
  const allowed = new Set([
    c.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
  ]);
  const corsMiddleware = cors({
    origin: (requestOrigin) => (requestOrigin && allowed.has(requestOrigin)) ? requestOrigin : '',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposeHeaders: ['Content-Disposition'],
    credentials: true,
    maxAge: 86400,
  });
  return corsMiddleware(c, next);
});

app.use('/api/*', ensureDbReady());
app.use('*', csrfProtection);
// Health check
app.get('/', (c) => c.text('API running'));
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.route('/api', authRoutes);
app.route('/api', eventRoutes);
app.route('/api', questionRoutes);
app.route('/api', examRoutes);
app.route('/api', resultRoutes);
app.route('/api/admin', adminRoutes);

// 404 handler
app.notFound((c) => c.json({ error: 'Route not found' }, 404));

// Error handler
app.onError((err, c) => {
  const requestId = c.get('requestId') || 'unknown';
  console.error(`[${requestId}] Unhandled error`, {
    method: c.req.method,
    path: c.req.path,
    error: err,
  });
  return c.json({ error: 'Internal server error', requestId }, 500);
});

export default app;
