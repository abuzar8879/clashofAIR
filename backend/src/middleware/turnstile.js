export async function turnstileOptional(c, next) {
  try {
    const secret = c.env.TURNSTILE_SECRET;
    if (!secret) {
      await next();
      return;
    }
    const token = c.req.header('X-Turnstile-Token') || null;
    if (!token) {
      await next();
      return;
    }
    const ip =
      c.req.header('CF-Connecting-IP') ||
      c.req.header('X-Forwarded-For') ||
      '';
    const form = new URLSearchParams();
    form.append('secret', secret);
    form.append('response', token);
    if (ip) form.append('remoteip', ip);
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const data = await resp.json();
    if (data && data.success) {
      await next();
      return;
    }
    return c.json({ error: 'Turnstile verification failed' }, 400);
  } catch (_) {
    return c.json({ error: 'Turnstile verification error' }, 400);
  }
}
