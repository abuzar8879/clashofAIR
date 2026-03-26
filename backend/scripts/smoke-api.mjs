const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:8787';

const cookieJar = new Map();

function parseSetCookie(setCookieHeader) {
  if (!setCookieHeader) return;
  const first = setCookieHeader.split(';')[0];
  const eqIndex = first.indexOf('=');
  if (eqIndex <= 0) return;
  const name = first.slice(0, eqIndex).trim();
  const value = first.slice(eqIndex + 1).trim();
  cookieJar.set(name, value);
}

function cookieHeader() {
  return Array.from(cookieJar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function getCsrfToken() {
  return cookieJar.get('csrf_token') || '';
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  const cookie = cookieHeader();
  if (cookie) headers.set('Cookie', cookie);

  const csrf = getCsrfToken();
  const method = (options.method || 'GET').toUpperCase();
  const unsafeMethod = method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH';
  if (unsafeMethod && csrf && !headers.has('X-CSRF-Token')) {
    headers.set('X-CSRF-Token', csrf);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (typeof response.headers.getSetCookie === 'function') {
    for (const value of response.headers.getSetCookie()) {
      parseSetCookie(value);
    }
  } else {
    const setCookieRaw = response.headers.get('set-cookie');
    if (setCookieRaw) parseSetCookie(setCookieRaw);
  }

  return response;
}

async function expectOk(response, label) {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${label} failed (${response.status}): ${body}`);
  }
}

async function run() {
  console.log(`Running smoke API checks against ${BASE_URL}`);

  const health = await request('/health');
  await expectOk(health, 'Health check');
  console.log('OK: /health');

  const publicEvents = await request('/api/events');
  await expectOk(publicEvents, 'Public events check');
  console.log('OK: GET /api/events');

  const uniq = `${Date.now()}`.slice(-6);
  const username = `smk${uniq}`;
  const email = `smoke${uniq}@example.com`;
  const password = 'Smoke@123';

  const register = await request('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      email,
      state: 'Maharashtra',
      aspirant_type: 'JEE-MAINS',
      password,
      confirm_password: password,
    }),
  });

  if (register.status !== 201 && register.status !== 409) {
    const body = await register.text();
    throw new Error(`Register failed (${register.status}): ${body}`);
  }
  console.log('OK: POST /api/register');

  const login = await request('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: username,
      password,
    }),
  });
  await expectOk(login, 'Login check');
  console.log('OK: POST /api/login');

  const authEvents = await request('/api/events');
  await expectOk(authEvents, 'Authenticated events check');
  const eventsData = await authEvents.json();
  console.log(`OK: Authenticated events count = ${(eventsData.events || []).length}`);

  const logout = await request('/api/logout', { method: 'POST' });
  await expectOk(logout, 'Logout check');
  console.log('OK: POST /api/logout');

  console.log('Smoke API checks completed successfully.');
}

run().catch((err) => {
  console.error(`Smoke API check failed: ${err.message}`);
  process.exitCode = 1;
});
