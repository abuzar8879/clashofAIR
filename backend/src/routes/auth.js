// ============================================================
// Auth Routes - Registration, Login, OAuth
// ============================================================
import { Hono } from 'hono';
import { generateToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { loginRateLimit, registerRateLimit } from '../middleware/rateLimit.js';
import { authMiddleware } from '../middleware/auth.js';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { verifyGoogleIdToken } from '../utils/google.js';
import { turnstileOptional } from '../middleware/turnstile.js';

export const authRoutes = new Hono();

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'
];

const VALID_ASPIRANT_TYPES = ['JEE-MAINS', 'JEE-ADV', 'NEET', 'MHT-CET'];

// POST /api/register
authRoutes.post('/register', registerRateLimit, turnstileOptional, async (c) => {
  try {
    console.log('register:incoming');
    let body;
    try {
      body = await c.req.json();
    } catch (parseErr) {
      let raw = null;
      try {
        raw = await c.req.raw.clone().text();
      } catch (_) {}
      console.error('register:json-parse-error', parseErr, raw);
      return c.json({ error: 'Invalid JSON body' }, 400);
    }
    console.log('register:parsed-body', body);
    const { username, email, state, aspirant_type, password, confirm_password } = body;

    // Validation
    if (!username || !email || !state || !aspirant_type || !password) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (username.length < 6 || username.length > 12) {
      return c.json({ error: 'Username must be 6-12 characters' }, 400);
    }

    if (!/^[a-zA-Z0-9_\-@]+$/.test(username)) {
      return c.json({ error: 'Username can only contain alphanumeric, _, -, @' }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: 'Invalid email address' }, 400);
    }

    if (!INDIAN_STATES.includes(state)) {
      return c.json({ error: 'Invalid state selected' }, 400);
    }

    if (!VALID_ASPIRANT_TYPES.includes(aspirant_type)) {
      return c.json({ error: 'Invalid aspirant type' }, 400);
    }

    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    if (typeof confirm_password === 'string' && password !== confirm_password) {
      return c.json({ error: 'Passwords do not match' }, 400);
    }

    // Check if user exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(username) = ? LIMIT 1'
    ).bind(email.toLowerCase(), username.toLowerCase()).first();

    if (existingUser) {
      return c.json({ error: 'Username or email already exists' }, 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert user
    const inserted = await c.env.DB.prepare(
      'INSERT INTO users (username, email, state, aspirant_type, password_hash) VALUES (?, ?, ?, ?, ?) RETURNING id'
    ).bind(
      username.toLowerCase(),
      email.toLowerCase(),
      state,
      aspirant_type,
      passwordHash
    ).first();

    if (!inserted) {
      return c.json({ error: 'Registration failed: database error' }, 500);
    }

    const userId = inserted.id;

    return c.json({
      success: true,
      message: 'Registration successful',
      user: { id: userId, username: username.toLowerCase(), email: email.toLowerCase(), state, aspirant_type, isAdmin: false }
    }, 201);

  } catch (e) {
    console.error('Register error:', e);
    return c.json({ error: 'Registration failed. Please try again.' }, 500);
  }
});

// POST /api/login
authRoutes.post('/login', loginRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return c.json({ error: 'Username/email and password are required' }, 400);
    }

    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ? LIMIT 1'
    ).bind(identifier.toLowerCase(), identifier.toLowerCase()).first();

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    if (!user.password_hash) {
      return c.json({ error: 'This account uses social login. Please use Google to sign in.' }, 401);
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = await generateToken(
      { userId: user.id, username: user.username, isAdmin: !!user.is_admin },
      c.env.JWT_SECRET
    );

    setCookie(c, 'access_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
    });

    try {
      const refreshId = crypto.getRandomValues(new Uint8Array(16));
      const refreshRaw = Array.from(refreshId).map(b => b.toString(16).padStart(2, '0')).join('');
      const refreshHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(refreshRaw));
      const refreshHash = Array.from(new Uint8Array(refreshHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      await c.env.DB.prepare(
        'INSERT INTO refresh_tokens (user_id, token_hash) VALUES (?, ?)'
      ).bind(user.id, refreshHash).run();

      setCookie(c, 'refresh_token', refreshRaw, {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        path: '/',
      });
    } catch (e) {
      console.warn('Refresh token insert failed, proceeding without refresh:', e);
    }

    return c.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        state: user.state,
        aspirant_type: user.aspirant_type,
        isAdmin: !!user.is_admin
      }
    });

  } catch (e) {
    console.error('Login error:', e);
    return c.json({ error: 'Login failed. Please try again.' }, 500);
  }
});

// POST /api/oauth/google
authRoutes.post('/oauth/google', async (c) => {
  try {
    const body = await c.req.json();
    const { credential, state, aspirant_type } = body;

    if (!credential) {
      return c.json({ error: 'Google credential is required' }, 400);
    }

    const payload = await verifyGoogleIdToken(credential, c.env.GOOGLE_CLIENT_ID);
    if (!payload) {
      return c.json({ error: 'Invalid Google credential' }, 400);
    }
    const { sub: googleId, email, name, picture } = payload;

    if (!email || !googleId) {
      return c.json({ error: 'Invalid Google account data' }, 400);
    }

    // Check if user exists
    let user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1'
    ).bind(email.toLowerCase()).first();

    if (!user) {
      // New user - need state and aspirant_type
      if (!state || !aspirant_type) {
        return c.json({ 
          needsProfile: true, 
          email,
          name,
          message: 'Please complete your profile' 
        }, 200);
      }

      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const finalUsername = `${username}_${Date.now().toString().slice(-4)}`;

      user = await c.env.DB.prepare(
        'INSERT INTO users (username, email, state, aspirant_type, oauth_provider) VALUES (?, ?, ?, ?, ?) RETURNING *'
      ).bind(
        finalUsername,
        email.toLowerCase(),
        state,
        aspirant_type,
        'google'
      ).first();
      
      if (!user) throw new Error('Failed to create user');
    }

    const token = await generateToken(
      { userId: user.id, username: user.username, isAdmin: !!user.is_admin },
      c.env.JWT_SECRET
    );

    setCookie(c, 'access_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
    });

    const refreshId = crypto.getRandomValues(new Uint8Array(16));
    const refreshRaw = Array.from(refreshId).map(b => b.toString(16).padStart(2, '0')).join('');
    const refreshHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(refreshRaw));
    const refreshHash = Array.from(new Uint8Array(refreshHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    await c.env.DB.prepare(
      'INSERT INTO refresh_tokens (user_id, token_hash) VALUES (?, ?)'
    ).bind(user.id, refreshHash).run();

    setCookie(c, 'refresh_token', refreshRaw, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
    });

    return c.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        state: user.state,
        aspirant_type: user.aspirant_type,
        isAdmin: !!user.is_admin
      }
    });

  } catch (e) {
    console.error('Google OAuth error:', e);
    return c.json({ error: 'Google authentication failed' }, 500);
  }
});

// GET /api/me
authRoutes.get('/me', authMiddleware, async (c) => {
  try {
    const currentUser = c.get('user');
    const user = await c.env.DB.prepare(
      'SELECT id, username, email, state, aspirant_type, is_admin, created_at FROM users WHERE id = ?'
    ).bind(currentUser.userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      id: user.id,
      username: user.username,
      email: user.email,
      state: user.state,
      aspirant_type: user.aspirant_type,
      isAdmin: !!user.is_admin,
      created_at: user.created_at
    });

  } catch (e) {
    console.error('Get me error:', e);
    return c.json({ error: 'Failed to get user data' }, 500);
  }
});

authRoutes.post('/refresh', async (c) => {
  try {
    const refreshRaw = getCookie(c, 'refresh_token');
    if (!refreshRaw) {
      return c.json({ error: 'No refresh token' }, 401);
    }
    const refreshHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(refreshRaw));
    const refreshHash = Array.from(new Uint8Array(refreshHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const record = await c.env.DB.prepare(
      'SELECT user_id, revoked_at FROM refresh_tokens WHERE token_hash = ? LIMIT 1'
    ).bind(refreshHash).first();

    if (!record || record.revoked_at) {
      deleteCookie(c, 'refresh_token');
      deleteCookie(c, 'access_token');
      return c.json({ error: 'Invalid refresh token' }, 401);
    }

    const user = await c.env.DB.prepare(
      'SELECT id, username, is_admin FROM users WHERE id = ?'
    ).bind(record.user_id).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const token = await generateToken(
      { userId: user.id, username: user.username, isAdmin: !!user.is_admin },
      c.env.JWT_SECRET
    );
    setCookie(c, 'access_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
    });

    const newId = crypto.getRandomValues(new Uint8Array(16));
    const newRaw = Array.from(newId).map(b => b.toString(16).padStart(2, '0')).join('');
    const newHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(newRaw));
    const newHash = Array.from(new Uint8Array(newHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const now = new Date().toISOString();
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ?').bind(now, refreshHash),
      c.env.DB.prepare('INSERT INTO refresh_tokens (user_id, token_hash, rotated_from) VALUES (?, ?, ?)').bind(user.id, newHash, refreshHash)
    ]);

    setCookie(c, 'refresh_token', newRaw, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
    });
    return c.json({ success: true });
  } catch (e) {
    console.error('Refresh error:', e);
    return c.json({ error: 'Refresh failed' }, 500);
  }
});

authRoutes.post('/logout', async (c) => {
  try {
    const refreshRaw = getCookie(c, 'refresh_token');
    if (refreshRaw) {
      const refreshHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(refreshRaw));
      const refreshHash = Array.from(new Uint8Array(refreshHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      await c.env.DB.prepare(
        'UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ?'
      ).bind(new Date().toISOString(), refreshHash).run();
    }
    deleteCookie(c, 'refresh_token');
    deleteCookie(c, 'access_token');
    return c.json({ success: true });
  } catch (e) {
    console.error('Logout error:', e);
    return c.json({ error: 'Logout failed' }, 500);
  }
});
