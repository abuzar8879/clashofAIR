function parseBooleanEnv(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return fallback;
}

function normalizeSameSite(value, secure) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'strict') return 'Strict';
  if (normalized === 'none') return secure ? 'None' : 'Lax';
  return 'Lax';
}

export function getCookieBaseOptions(c) {
  const reqUrl = new URL(c.req.url);
  const defaultSecure = reqUrl.protocol === 'https:';
  const secure = parseBooleanEnv(c.env.COOKIE_SECURE, defaultSecure);
  const sameSite = normalizeSameSite(c.env.COOKIE_SAME_SITE, secure);

  const options = {
    secure,
    sameSite,
    path: '/',
  };

  if (c.env.COOKIE_DOMAIN) {
    options.domain = c.env.COOKIE_DOMAIN;
  }

  return options;
}

export function getAuthCookieOptions(c) {
  return {
    ...getCookieBaseOptions(c),
    httpOnly: true,
  };
}

export function getClientCookieOptions(c) {
  return {
    ...getCookieBaseOptions(c),
    httpOnly: false,
  };
}

export function getCookieClearOptions(c) {
  const base = getCookieBaseOptions(c);
  const clearOptions = { path: base.path };
  if (base.domain) clearOptions.domain = base.domain;
  return clearOptions;
}
