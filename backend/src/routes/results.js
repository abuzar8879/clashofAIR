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

// GET /api/my-results - Latest results for current user
resultRoutes.get('/my-results', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { limit = 5 } = c.req.query();

    const parsedLimit = Number(limit);
    const safeLimit = parsedLimit === 3 || parsedLimit === 5 ? parsedLimit : 5;

    const query = `
      SELECT s.event_id, s.score, s.percentile, s.rank, s.time_taken, s.correct_count, s.incorrect_count, s.submitted_at,
             e.title as event_title, e.exam_type, e.date as event_date, e.duration as event_duration, e.question_count
      FROM submissions s
      JOIN events e ON s.event_id = e.id
      WHERE s.user_id = ?
      ORDER BY s.submitted_at DESC
      LIMIT ?
    `;

    const rows = await c.env.DB.prepare(query).bind(user.userId, safeLimit).all();
    const results = (rows.results || []).map((r) => {
      const totalQuestions = Number(r.question_count || 0);
      const correctCount = Number(r.correct_count || 0);
      const incorrectCount = Number(r.incorrect_count || 0);

      return {
        event: {
          id: r.event_id,
          title: r.event_title,
          exam_type: r.exam_type,
          date: r.event_date,
          duration: r.event_duration,
          question_count: totalQuestions,
        },
        result: {
          score: r.score,
          percentile: r.percentile,
          rank: r.rank,
          totalQuestions,
          correctCount,
          incorrectCount,
          unattempted: Math.max(totalQuestions - correctCount - incorrectCount, 0),
          timeTaken: r.time_taken,
          submittedAt: r.submitted_at,
        }
      };
    });

    return c.json({
      limit: safeLimit,
      count: results.length,
      results,
    });

  } catch (e) {
    console.error('My results error:', e);
    return c.json({ error: 'Failed to fetch latest results' }, 500);
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

    // Get user's submission
    const submission = await c.env.DB.prepare(
      'SELECT s.*, (SELECT COUNT(*) FROM submissions WHERE event_id = ?) as total_participants FROM submissions s WHERE s.user_id = ? AND s.event_id = ? LIMIT 1'
    ).bind(eventId, user.userId, eventId).first();

    // If user has submitted, always show result (even before official end)
    if (submission) {
      const qCount = await c.env.DB.prepare(
        'SELECT COUNT(*) as count FROM questions WHERE event_id = ?'
      ).bind(eventId).first();

      const totalQuestions = Number(qCount.count || event.question_count || 0);
      const correctCount = Number(submission.correct_count || 0);
      const incorrectCount = Number(submission.incorrect_count || 0);

      return c.json({
        resultAvailable: true,
        result: {
          score: submission.score,
          totalQuestions,
          percentile: submission.percentile,
          rank: submission.rank,
          totalParticipants: submission.total_participants || null,
          correctCount,
          incorrectCount,
          unattempted: Math.max(totalQuestions - correctCount - incorrectCount, 0),
          timeTaken: submission.time_taken,
          submittedAt: submission.submitted_at,
        },
        event: {
          id: event.id,
          title: event.title,
          exam_type: event.exam_type,
        }
      });
    }

    // For non-submitted users, keep reveal lock until exam end
    const end = new Date(new Date(event.date).getTime() + event.duration * 60 * 1000);
    const now = new Date();

    if (now < end && !user.isAdmin) {
      return c.json({
        resultAvailable: false,
        message: 'Results will be available after the exam ends',
        endsAt: end.toISOString(),
        event: {
          id: event.id,
          title: event.title,
          exam_type: event.exam_type,
          date: event.date,
          duration: event.duration,
          question_count: event.question_count,
        }
      });
    }

    return c.json({ error: 'No submission found for this exam' }, 404);

  } catch (e) {
    console.error('Get result error:', e);
    return c.json({ error: 'Failed to fetch result' }, 500);
  }
});
