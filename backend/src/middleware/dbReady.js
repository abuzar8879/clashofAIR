const REQUIRED_TABLES = [
  'users',
  'events',
  'questions',
  'registrations',
  'submissions',
  'answers',
  'violations',
  'refresh_tokens',
];

let schemaCheck = {
  checkedAt: 0,
  ok: false,
  missing: [],
};

export function ensureDbReady(requiredTables = REQUIRED_TABLES) {
  return async (c, next) => {
    const now = Date.now();
    const cacheValid = schemaCheck.ok && (now - schemaCheck.checkedAt < 5 * 60 * 1000);
    if (cacheValid) {
      await next();
      return;
    }

    try {
      const placeholders = requiredTables.map(() => '?').join(', ');
      const query = `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${placeholders})`;
      const existingTables = await c.env.DB.prepare(query).bind(...requiredTables).all();
      const found = new Set((existingTables.results || []).map(row => row.name));
      const missing = requiredTables.filter(table => !found.has(table));

      schemaCheck = {
        checkedAt: now,
        ok: missing.length === 0,
        missing,
      };

      if (missing.length > 0) {
        const requestId = c.get('requestId') || 'unknown';
        console.error(`[${requestId}] DB schema missing tables: ${missing.join(', ')}`);
        return c.json({
          error: 'Database not initialized',
          message: `Missing tables: ${missing.join(', ')}`,
          hint: 'Run `npm run db:reset && npm run db:migrate && npm run db:seed` in the backend folder.',
          requestId,
        }, 503);
      }

      await next();
    } catch (err) {
      const requestId = c.get('requestId') || 'unknown';
      console.error(`[${requestId}] DB readiness check failed`, err);
      return c.json({
        error: 'Database readiness check failed',
        requestId,
      }, 500);
    }
  };
}
