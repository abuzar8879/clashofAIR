import { Hono } from 'hono';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';

export const eventRoutes = new Hono();

// GET /api/events - List all visible events
eventRoutes.get('/events', optionalAuth, async (c) => {
  try {
    const user = c.get('user');
    const { exam_type, page = 1, limit = 20 } = c.req.query();

    let query = 'SELECT * FROM events WHERE is_visible = 1';
    let params = [];

    if (exam_type && exam_type !== 'All') {
      query += ' AND exam_type = ?';
      params.push(exam_type);
    }

    const l = Number(limit);
    const o = (Number(page) - 1) * l;
    query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    params.push(l, o);

    const events = await c.env.DB.prepare(query).bind(...params).all();

    // If user is logged in, check registrations and submissions
    let registeredEventIds = new Set();
    let submittedEventIds = new Set();

    if (user) {
      const regs = await c.env.DB.prepare(
        'SELECT event_id FROM registrations WHERE user_id = ?'
      ).bind(user.userId).all();
      registeredEventIds = new Set((regs.results || []).map(r => r.event_id));

      const subs = await c.env.DB.prepare(
        'SELECT event_id FROM submissions WHERE user_id = ?'
      ).bind(user.userId).all();
      submittedEventIds = new Set((subs.results || []).map(s => s.event_id));
    }

    const enrichedEvents = (events.results || []).map(event => ({
      ...event,
      isRegistered: registeredEventIds.has(event.id),
      isSubmitted: submittedEventIds.has(event.id),
      status: getEventStatus(event.date, event.duration),
    }));

    return c.json({ events: enrichedEvents });

  } catch (e) {
    console.error('Get events error:', e);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

// GET /api/events/:id - Single event
eventRoutes.get('/events/:id', optionalAuth, async (c) => {
  try {
    const user = c.get('user');
    const eventId = parseInt(c.req.param('id'));

    const event = await c.env.DB.prepare(
      'SELECT * FROM events WHERE id = ? AND is_visible = 1 LIMIT 1'
    ).bind(eventId).first();

    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    // Get participant count
    const participantCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM registrations WHERE event_id = ?'
    ).bind(eventId).first();

    let isRegistered = false;
    let isSubmitted = false;

    if (user) {
      const reg = await c.env.DB.prepare(
        'SELECT id FROM registrations WHERE user_id = ? AND event_id = ? LIMIT 1'
      ).bind(user.userId, eventId).first();
      isRegistered = !!reg;

      const sub = await c.env.DB.prepare(
        'SELECT id FROM submissions WHERE user_id = ? AND event_id = ? LIMIT 1'
      ).bind(user.userId, eventId).first();
      isSubmitted = !!sub;
    }

    return c.json({
      ...event,
      participant_count: participantCount.count || 0,
      isRegistered,
      isSubmitted,
      status: getEventStatus(event.date, event.duration),
    });

  } catch (e) {
    console.error('Get event error:', e);
    return c.json({ error: 'Failed to fetch event' }, 500);
  }
});

// POST /api/events - Create event (admin)
eventRoutes.post('/events', authMiddleware, adminOnly, async (c) => {
  try {
    const body = await c.req.json();
    const { title, exam_type, date, duration, question_count, is_visible = 1, subjects_config } = body;

    if (!title || !exam_type || !date || !duration || !question_count) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    const user = c.get('user');

    const event = await c.env.DB.prepare(
      'INSERT INTO events (title, exam_type, date, duration, question_count, is_visible, subjects_config, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *'
    ).bind(
      title,
      exam_type,
      date,
      Number(duration),
      Number(question_count),
      Number(is_visible),
      subjects_config || null,
      user.userId
    ).first();

    return c.json({ success: true, event }, 201);

  } catch (e) {
    console.error('Create event error:', e);
    return c.json({ error: 'Failed to create event' }, 500);
  }
});

// PUT /api/events/:id - Update event (admin)
eventRoutes.put('/events/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const eventId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const { title, exam_type, date, duration, question_count, is_visible, subjects_config } = body;

    const existing = await c.env.DB.prepare('SELECT id FROM events WHERE id = ?').bind(eventId).first();

    if (!existing) {
      return c.json({ error: 'Event not found' }, 404);
    }

    const updated = await c.env.DB.prepare(
      'UPDATE events SET title = ?, exam_type = ?, date = ?, duration = ?, question_count = ?, is_visible = ?, subjects_config = ? WHERE id = ? RETURNING *'
    ).bind(
      title,
      exam_type,
      date,
      Number(duration),
      Number(question_count),
      Number(is_visible),
      subjects_config || null,
      eventId
    ).first();

    return c.json({ success: true, event: updated });

  } catch (e) {
    console.error('Update event error:', e);
    return c.json({ error: 'Failed to update event' }, 500);
  }
});

// DELETE /api/events/:id - Delete event (admin)
eventRoutes.delete('/events/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const eventId = parseInt(c.req.param('id'));

    const existing = await c.env.DB.prepare('SELECT id FROM events WHERE id = ?').bind(eventId).first();

    if (!existing) {
      return c.json({ error: 'Event not found' }, 404);
    }

    await c.env.DB.prepare('DELETE FROM events WHERE id = ?').bind(eventId).run();
    return c.json({ success: true, message: 'Event deleted successfully' });

  } catch (e) {
    console.error('Delete event error:', e);
    return c.json({ error: 'Failed to delete event' }, 500);
  }
});

function getEventStatus(dateStr, durationMinutes) {
  const now = new Date();
  const start = new Date(dateStr);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'live';
  return 'ended';
}
