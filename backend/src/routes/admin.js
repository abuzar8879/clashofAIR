import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { recalculatePercentileAndRank } from '../utils/percentile.js';

export const adminRoutes = new Hono();

// Apply auth + admin middleware to all admin routes
adminRoutes.use('*', authMiddleware, adminOnly);

// GET /api/admin/dashboard - Stats
adminRoutes.get('/dashboard', async (c) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as totalUsers,
        (SELECT COUNT(*) FROM events) as totalEvents,
        (SELECT COUNT(*) FROM submissions) as totalSubmissions
    `;
    const stats = await c.env.DB.prepare(statsQuery).first();

    const now = new Date().toISOString();
    const recentEvents = await c.env.DB.prepare(
      'SELECT * FROM events ORDER BY created_at DESC LIMIT 5'
    ).all();

    const recentSubmissionsQuery = `
      SELECT s.*, u.username, e.title as event_title
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      JOIN events e ON s.event_id = e.id
      ORDER BY s.submitted_at DESC
      LIMIT 10
    `;
    const recentSubmissions = await c.env.DB.prepare(recentSubmissionsQuery).all();

    const activeEventsData = await c.env.DB.prepare(
      'SELECT id, date, duration FROM events'
    ).all();
    
    const nowTime = new Date();
    const activeEventsCount = (activeEventsData.results || []).filter(e => {
      const start = new Date(e.date);
      const end = new Date(start.getTime() + e.duration * 60 * 1000);
      return nowTime >= start && nowTime <= end;
    }).length;

    return c.json({
      stats: {
        totalUsers: stats.totalUsers || 0,
        totalEvents: stats.totalEvents || 0,
        totalSubmissions: stats.totalSubmissions || 0,
        activeEvents: activeEventsCount,
      },
      recentEvents: recentEvents.results || [],
      recentSubmissions: recentSubmissions.results || [],
    });

  } catch (e) {
    console.error('Dashboard error:', e);
    return c.json({ error: 'Failed to fetch dashboard data' }, 500);
  }
});

// GET /api/admin/users
adminRoutes.get('/users', async (c) => {
  try {
    const { page = 1, limit = 20, search = '' } = c.req.query();
    const offset = (Number(page) - 1) * Number(limit);

    let query = 'SELECT id, username, email, state, aspirant_type, is_admin, created_at FROM users';
    let countQuery = 'SELECT COUNT(*) as count FROM users';
    let params = [];

    if (search) {
      const searchPattern = `%${search}%`;
      query += ' WHERE username LIKE ? OR email LIKE ?';
      countQuery += ' WHERE username LIKE ? OR email LIKE ?';
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const finalParams = [...params, Number(limit), offset];

    const [users, total] = await Promise.all([
      c.env.DB.prepare(query).bind(...finalParams).all(),
      c.env.DB.prepare(countQuery).bind(...params).first()
    ]);

    return c.json({
      users: users.results || [],
      total: total.count || 0,
      page: Number(page),
      totalPages: Math.ceil((total.count || 0) / Number(limit)),
    });

  } catch (e) {
    console.error('Get users error:', e);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// DELETE /api/admin/users/:id
adminRoutes.delete('/users/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const currentUser = c.get('user');

    if (userId === currentUser.userId) {
      return c.json({ error: 'Cannot delete your own admin account' }, 400);
    }

    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
    return c.json({ success: true, message: 'User deleted' });

  } catch (e) {
    console.error('Delete user error:', e);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// GET /api/admin/users/:id/attempts
adminRoutes.get('/users/:id/attempts', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const attemptsQuery = `
      SELECT s.*, e.title as event_title, e.exam_type
      FROM submissions s
      JOIN events e ON s.event_id = e.id
      WHERE s.user_id = ?
      ORDER BY s.submitted_at DESC
    `;
    const attempts = await c.env.DB.prepare(attemptsQuery).bind(userId).all();
    return c.json({ attempts: attempts.results || [] });

  } catch (e) {
    console.error('Get user attempts error:', e);
    return c.json({ error: 'Failed to fetch user attempts' }, 500);
  }
});

// GET /api/admin/results
adminRoutes.get('/results', async (c) => {
  try {
    const { event_id, page = 1, limit = 50 } = c.req.query();
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT s.*, u.username, u.state, u.aspirant_type, e.title as event_title, e.exam_type
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      JOIN events e ON s.event_id = e.id
    `;
    let countQuery = 'SELECT COUNT(*) as count FROM submissions s';
    let params = [];

    if (event_id) {
      query += ' WHERE s.event_id = ?';
      countQuery += ' WHERE s.event_id = ?';
      params.push(Number(event_id));
    }

    query += ' ORDER BY s.submitted_at DESC LIMIT ? OFFSET ?';
    const finalParams = [...params, Number(limit), offset];

    const [results, total] = await Promise.all([
      c.env.DB.prepare(query).bind(...finalParams).all(),
      c.env.DB.prepare(countQuery).bind(...params).first()
    ]);

    return c.json({
      results: results.results || [],
      total: total.count || 0,
    });

  } catch (e) {
    console.error('Get results error:', e);
    return c.json({ error: 'Failed to fetch results' }, 500);
  }
});

// POST /api/admin/recalculate/:eventId
adminRoutes.post('/recalculate/:eventId', async (c) => {
  try {
    const eventId = parseInt(c.req.param('eventId'));
    await recalculatePercentileAndRank(c.env.DB, eventId);
    return c.json({ success: true, message: 'Leaderboard recalculated successfully' });

  } catch (e) {
    console.error('Recalculate error:', e);
    return c.json({ error: 'Failed to recalculate leaderboard' }, 500);
  }
});

// GET /api/admin/export/:eventId - Export CSV
adminRoutes.get('/export/:eventId', async (c) => {
  try {
    const eventId = parseInt(c.req.param('eventId'));
    const event = await c.env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(eventId).first();
    if (!event) return c.json({ error: 'Event not found' }, 404);

    const resultsQuery = `
      SELECT s.rank, s.score, s.percentile, s.correct_count, s.incorrect_count, s.time_taken, s.submitted_at, 
             u.username, u.email, u.state, u.aspirant_type
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      WHERE s.event_id = ?
      ORDER BY s.rank ASC
    `;
    const results = await c.env.DB.prepare(resultsQuery).bind(eventId).all();

    const csvHeaders = 'Rank,Username,Email,State,Aspirant Type,Score,Percentile,Correct,Incorrect,Time Taken (s),Submitted At\n';
    const csvRows = (results.results || []).map(r =>
      `${r.rank},${r.username},${r.email},${r.state},${r.aspirant_type},${r.score},${r.percentile},${r.correct_count},${r.incorrect_count},${r.time_taken},${r.submitted_at}`
    ).join('\n');

    const csv = csvHeaders + csvRows;

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="results-${event.title.replace(/\s+/g, '-')}-${eventId}.csv"`,
      }
    });

  } catch (e) {
    console.error('Export error:', e);
    return c.json({ error: 'Failed to export results' }, 500);
  }
});

// GET /api/admin/events - All events including hidden
adminRoutes.get('/events', async (c) => {
  try {
    const query = `
      SELECT e.*, 
             (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) as registrations_count,
             (SELECT COUNT(*) FROM submissions s WHERE s.event_id = e.id) as submissions_count
      FROM events e
      ORDER BY e.created_at DESC
    `;
    const events = await c.env.DB.prepare(query).all();

    return c.json({ 
      events: (events.results || []).map(e => ({
        ...e,
        registrations: e.registrations_count || 0,
        submissions: e.submissions_count || 0,
      })) 
    });

  } catch (e) {
    console.error('Admin get events error:', e);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

// GET /api/admin/violations
adminRoutes.get('/violations', async (c) => {
  try {
    const { event_id } = c.req.query();

    let query = `
      SELECT v.*, u.username, e.title as event_title
      FROM violations v
      JOIN users u ON v.user_id = u.id
      JOIN events e ON v.event_id = e.id
    `;
    let params = [];
    if (event_id) {
      query += ' WHERE v.event_id = ?';
      params.push(Number(event_id));
    }
    query += ' ORDER BY v.created_at DESC LIMIT 100';

    const violations = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ violations: violations.results || [] });

  } catch (e) {
    console.error('Get violations error:', e);
    return c.json({ error: 'Failed to fetch violations' }, 500);
  }
});
