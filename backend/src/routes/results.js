import { Hono } from 'hono';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

export const resultRoutes = new Hono();

// GET /api/leaderboard/:eventId
resultRoutes.get('/leaderboard/:eventId', optionalAuth, async (c) => {
  try {
    const eventId = parseInt(c.req.param('eventId'));
    const user = c.get('user');
    const { page = 1, limit = 50 } = c.req.query();

    const event = await c.env.DB.prepare('SELECT * FROM events WHERE id = ? LIMIT 1').bind(eventId).first();

    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    // Check if event has ended
    const start = new Date(event.date);
    const end = new Date(start.getTime() + event.duration * 60 * 1000);
    const now = new Date();

    if (now < end && (!user || !user.isAdmin)) {
      return c.json({ 
        error: 'Leaderboard Reveal', 
        message: 'The final rankings will be revealed once the exam ends! Stay tuned.',
        endsAt: end.toISOString()
      }, 403);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const leaderboardQuery = `
      SELECT s.rank, s.score, s.percentile, s.submitted_at, s.user_id, u.username, u.state, u.aspirant_type
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      WHERE s.event_id = ?
      ORDER BY s.rank ASC, s.submitted_at ASC
      LIMIT ? OFFSET ?
    `;
    const leaderboard = await c.env.DB.prepare(leaderboardQuery).bind(eventId, Number(limit), offset).all();

    const totalCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM submissions WHERE event_id = ?'
    ).bind(eventId).first();

    // Get current user's entry
    let userEntry = null;
    if (user) {
      const ueQuery = `
        SELECT s.rank, s.score, s.percentile, u.username, u.state
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        WHERE s.event_id = ? AND s.user_id = ?
        LIMIT 1
      `;
      userEntry = await c.env.DB.prepare(ueQuery).bind(eventId, user.userId).first();
    }

    const entries = (leaderboard.results || []).map(entry => ({
      ...entry,
      isCurrentUser: user ? entry.user_id === user.userId : false,
    }));

    return c.json({
      leaderboard: entries,
      totalParticipants: totalCount.count || 0,
      currentPage: Number(page),
      userEntry,
      event: { id: event.id, title: event.title, exam_type: event.exam_type }
    });

  } catch (e) {
    console.error('Leaderboard error:', e);
    return c.json({ error: 'Failed to fetch leaderboard' }, 500);
  }
});

// GET /api/result/:eventId - User's result
resultRoutes.get('/result/:eventId', authMiddleware, async (c) => {
  try {
    const eventId = parseInt(c.req.param('eventId'));
    const user = c.get('user');

    const event = await c.env.DB.prepare('SELECT * FROM events WHERE id = ? LIMIT 1').bind(eventId).first();

    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    // Check if event has ended
    const end = new Date(new Date(event.date).getTime() + event.duration * 60 * 1000);
    const now = new Date();

    if (now < end && !user.isAdmin) {
      return c.json({
        resultAvailable: false,
        message: 'Results will be available after the exam ends',
        endsAt: end.toISOString()
      });
    }

    // Get user's submission
    const submission = await c.env.DB.prepare(
      'SELECT s.*, (SELECT COUNT(*) FROM submissions WHERE event_id = ?) as total_participants FROM submissions s WHERE s.user_id = ? AND s.event_id = ? LIMIT 1'
    ).bind(eventId, user.userId, eventId).first();

    if (!submission) {
      return c.json({ error: 'No submission found for this exam' }, 404);
    }

    // Get question count
    const qCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM questions WHERE event_id = ?'
    ).bind(eventId).first();

    return c.json({
      resultAvailable: true,
      result: {
        score: submission.score,
        totalQuestions: qCount.count || event.question_count,
        percentile: submission.percentile,
        rank: submission.rank,
        totalParticipants: submission.total_participants || null,
        correctCount: submission.correct_count,
        incorrectCount: submission.incorrect_count,
        unattempted: (qCount.count || event.question_count) - submission.correct_count - submission.incorrect_count,
        timeTaken: submission.time_taken,
        submittedAt: submission.submitted_at,
      },
      event: {
        id: event.id,
        title: event.title,
        exam_type: event.exam_type,
      }
    });

  } catch (e) {
    console.error('Get result error:', e);
    return c.json({ error: 'Failed to fetch result' }, 500);
  }
});
