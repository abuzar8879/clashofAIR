export async function verifyGoogleIdToken(idToken, audience) {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const decode = (b64) => JSON.parse(
      atob(b64.replace(/-/g, '+').replace(/_/g, '/'))
    );
    const header = decode(headerB64);
    const payload = decode(payloadB64);
    if (!header || header.alg !== 'RS256' || !header.kid) return null;
    const now = Math.floor(Date.now() / 1000);
    if (!payload || payload.exp < now) return null;
    if (payload.aud !== audience) return null;
    const iss = payload.iss;
    if (iss !== 'accounts.google.com' && iss !== 'https://accounts.google.com') return null;
    const jwksResp = await fetch('https://www.googleapis.com/oauth2/v3/certs');
    if (!jwksResp.ok) return null;
    const jwks = await jwksResp.json();
    const jwk = (jwks.keys || []).find(k => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = Uint8Array.from(
      atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      sigBytes,
      new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    );
    return valid ? payload : null;
  } catch (_) {
    return null;
  }
}
