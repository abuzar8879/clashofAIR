import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { recalculatePercentileAndRank } from '../utils/percentile.js';

export const examRoutes = new Hono();

// POST /api/register-event
examRoutes.post('/register-event', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { event_id } = body;

    if (!event_id) {
      return c.json({ error: 'event_id is required' }, 400);
    }

    const user = c.get('user');

    // Check event exists
    const event = await c.env.DB.prepare(
      'SELECT * FROM events WHERE id = ? AND is_visible = 1 LIMIT 1'
    ).bind(Number(event_id)).first();

    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    // Check event hasn't ended
    const end = new Date(new Date(event.date).getTime() + event.duration * 60 * 1000);
    if (new Date() > end) {
      return c.json({ error: 'This exam has already ended. Registration is closed.' }, 400);
    }

    // Check already registered
    const existing = await c.env.DB.prepare(
      'SELECT id FROM registrations WHERE user_id = ? AND event_id = ? LIMIT 1'
    ).bind(user.userId, Number(event_id)).first();

    if (existing) {
      return c.json({ success: true, message: 'Already registered', alreadyRegistered: true });
    }

    await c.env.DB.prepare(
      'INSERT INTO registrations (user_id, event_id) VALUES (?, ?)'
    ).bind(user.userId, Number(event_id)).run();

    return c.json({ success: true, message: 'Successfully registered for exam' }, 201);

  } catch (e) {
    console.error('Register event error:', e);
    return c.json({ error: 'Failed to register for event' }, 500);
  }
});

// GET /api/exam-status/:eventId
examRoutes.get('/exam-status/:eventId', authMiddleware, async (c) => {
  try {
    const eventId = parseInt(c.req.param('eventId'));
    const user = c.get('user');

    const event = await c.env.DB.prepare('SELECT * FROM events WHERE id = ? LIMIT 1').bind(eventId).first();

    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    const reg = await c.env.DB.prepare(
      'SELECT id FROM registrations WHERE user_id = ? AND event_id = ? LIMIT 1'
    ).bind(user.userId, eventId).first();

    const sub = await c.env.DB.prepare(
      'SELECT * FROM submissions WHERE user_id = ? AND event_id = ? LIMIT 1'
    ).bind(user.userId, eventId).first();

    const now = new Date();
    const start = new Date(event.date);
    const end = new Date(start.getTime() + event.duration * 60 * 1000);

    let status = 'upcoming';
    if (now >= start && now <= end) status = 'live';
    if (now > end) status = 'ended';

    return c.json({
      isRegistered: !!reg,
      isSubmitted: !!sub,
      eventStatus: status,
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        duration: event.duration,
      }
    });

  } catch (e) {
    console.error('Exam status error:', e);
    return c.json({ error: 'Failed to get exam status' }, 500);
  }
});

// POST /api/submit-exam
examRoutes.post('/submit-exam', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { event_id, answers, time_taken } = body;

    if (!event_id || !answers) {
      return c.json({ error: 'event_id and answers are required' }, 400);
    }

    const user = c.get('user');
    const eventId = Number(event_id);

    // Check event exists
    const event = await c.env.DB.prepare('SELECT * FROM events WHERE id = ? LIMIT 1').bind(eventId).first();

    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    // Check event time is valid (allow 5 minute buffer after end)
    const start = new Date(event.date);
    const end = new Date(start.getTime() + (event.duration + 5) * 60 * 1000);
    const now = new Date();

    if (now < start) {
      return c.json({ error: 'Exam has not started yet' }, 400);
    }

    // Check registration
    const reg = await c.env.DB.prepare(
      'SELECT id FROM registrations WHERE user_id = ? AND event_id = ? LIMIT 1'
    ).bind(user.userId, eventId).first();

    if (!reg) {
      return c.json({ error: 'You are not registered for this exam' }, 403);
    }

    // Check no existing submission
    const existing = await c.env.DB.prepare(
      'SELECT id FROM submissions WHERE user_id = ? AND event_id = ? LIMIT 1'
    ).bind(user.userId, eventId).first();

    if (existing) {
      return c.json({ error: 'You have already submitted this exam' }, 409);
    }

    // Get all questions with correct answers
    const questionsResult = await c.env.DB.prepare(
      'SELECT id, subject, correct_answer FROM questions WHERE event_id = ?'
    ).bind(eventId).all();
    const questions = questionsResult.results || [];

    // Parse subject config
    let subjects = [];
    try {
      subjects = event.subjects_config ? (typeof event.subjects_config === 'string' ? JSON.parse(event.subjects_config) : event.subjects_config) : [];
    } catch (e) {
      console.error('Failed to parse subjects_config', e);
    }

    // Mark questions
    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    for (const question of questions) {
      const selectedOption = answers[question.id.toString()];
      if (selectedOption) {
        // Find subject marking rules
        const subConfig = subjects.find(s => s.name === question.subject) || { positive_marks: 1, negative_marks: 0 };
        const pos = Number(subConfig.positive_marks || 1);
        const neg = Number(subConfig.negative_marks || 0);

        if (selectedOption.toUpperCase() === question.correct_answer.toUpperCase()) {
          correctCount++;
          totalScore += pos;
        } else {
          incorrectCount++;
          totalScore -= neg;
        }
      }
    }

    const score = totalScore;

    // Insert submission
    const submission = await c.env.DB.prepare(
      'INSERT INTO submissions (user_id, event_id, score, time_taken, correct_count, incorrect_count) VALUES (?, ?, ?, ?, ?, ?) RETURNING id'
    ).bind(
      user.userId,
      eventId,
      score,
      time_taken || 0,
      correctCount,
      incorrectCount
    ).first();

    if (!submission) throw new Error('Failed to insert submission');
    const submissionId = submission.id;

    // Insert individual answers
    const answerStmt = c.env.DB.prepare(
      'INSERT INTO answers (submission_id, question_id, selected_option) VALUES (?, ?, ?)'
    );
    const batch = Object.entries(answers).map(([questionId, selectedOption]) => 
      answerStmt.bind(submissionId, Number(questionId), selectedOption)
    );
    
    if (batch.length > 0) {
      await c.env.DB.batch(batch);
    }

    // Recalculate percentile and rank for all submissions
    await recalculatePercentileAndRank(c.env.DB, eventId);

    // Get updated submission with percentile/rank
    const submissionFull = await c.env.DB.prepare(
      'SELECT * FROM submissions WHERE id = ?'
    ).bind(submissionId).first();

    return c.json({
      success: true,
      message: 'Exam submitted successfully',
      result: {
        score,
        totalQuestions: questions.length,
        correctCount,
        incorrectCount,
        unattempted: questions.length - correctCount - incorrectCount,
        percentile: submissionFull.percentile,
        rank: submissionFull.rank,
        timeTaken: time_taken || 0,
      }
    });

  } catch (e) {
    console.error('Submit exam error:', e);
    return c.json({ error: 'Failed to submit exam. Please try again.' }, 500);
  }
});

// POST /api/violations - Log anti-cheat violation
examRoutes.post('/violations', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { event_id, violation_type } = body;

    if (!event_id || !violation_type) {
      return c.json({ error: 'event_id and violation_type are required' }, 400);
    }

    const user = c.get('user');

    // Check if violation record exists
    const existing = await c.env.DB.prepare(
      'SELECT id, violation_count FROM violations WHERE user_id = ? AND event_id = ? LIMIT 1'
    ).bind(user.userId, Number(event_id)).first();

    if (existing) {
      const updated = await c.env.DB.prepare(
        'UPDATE violations SET violation_count = ?, violation_type = ? WHERE id = ? RETURNING violation_count'
      ).bind((existing.violation_count || 1) + 1, violation_type, existing.id).first();

      return c.json({ success: true, violation_count: updated.violation_count });
    } else {
      await c.env.DB.prepare(
        'INSERT INTO violations (user_id, event_id, violation_type) VALUES (?, ?, ?)'
      ).bind(user.userId, Number(event_id), violation_type).run();

      return c.json({ success: true, violation_count: 1 });
    }

  } catch (e) {
    console.error('Log violation error:', e);
    return c.json({ error: 'Failed to log violation' }, 500);
  }
});
