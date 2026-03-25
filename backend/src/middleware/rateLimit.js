// ============================================================
// Rate Limiting Middleware (In-memory, per Worker instance)
// ============================================================

const rateLimitStore = new Map();

function getRateLimitKey(c, prefix) {
  const ip = c.req.header('CF-Connecting-IP') || 
             c.req.header('X-Forwarded-For') || 
             'unknown';
  return `${prefix}:${ip}`;
}

function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

let lastCleanup = Date.now();

// Lazy cleanup called during requests
function cleanupIfNeeded() {
  const now = Date.now();
  if (now - lastCleanup > 60000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
    lastCleanup = now;
  }
}
export function createRateLimit(maxRequests, windowMs, prefix = 'rl') {
  return async (c, next) => {
    cleanupIfNeeded();
    const key = getRateLimitKey(c, prefix);
    const result = checkRateLimit(key, maxRequests, windowMs);

    if (!result.allowed) {
      return c.json(
        { error: 'Too many requests. Please try again later.' },
        429
      );
    }

    await next();
  };
}

// Pre-configured rate limiters
export const loginRateLimit = createRateLimit(5, 60 * 1000, 'login');
export const registerRateLimit = createRateLimit(3, 60 * 1000, 'register');
export const generalRateLimit = createRateLimit(100, 60 * 1000, 'general');
