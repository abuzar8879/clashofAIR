import { setCookie, getCookie } from 'hono/cookie';

function randomHex(bytes) {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function csrfProtection(c, next) {
  let csrf = getCookie(c, 'csrf_token');
  if (!csrf) {
    csrf = randomHex(16);
    setCookie(c, 'csrf_token', csrf, {
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
      path: '/',
    });
    await next();
    return;
  }
  const method = c.req.method.toUpperCase();
  const unsafe = method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH';
  if (unsafe) {
    const headerToken = c.req.header('X-CSRF-Token');
    if (!headerToken || headerToken !== csrf) {
      return c.json({ error: 'CSRF token invalid' }, 403);
    }
  }
  await next();
}
