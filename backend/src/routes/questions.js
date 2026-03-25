import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';

export const questionRoutes = new Hono();

// Fisher-Yates shuffle
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Shuffle options while tracking correct answer
function shuffleOptions(question) {
  const options = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d },
  ];
  
  const shuffled = shuffle(options);
  const correctOriginalKey = question.correct_answer;
  const correctText = question[`option_${correctOriginalKey.toLowerCase()}`];
  
  const newCorrectKey = shuffled.findIndex(o => o.text === correctText);
  const keyMap = ['A', 'B', 'C', 'D'];
  
  return {
    ...question,
    option_a: shuffled[0].text,
    option_b: shuffled[1].text,
    option_c: shuffled[2].text,
    option_d: shuffled[3].text,
    correct_answer: keyMap[newCorrectKey],
  };
}

// GET /api/questions/:eventId - Get questions for exam (randomized)
questionRoutes.get('/questions/:eventId', authMiddleware, async (c) => {
  try {
    const eventId = parseInt(c.req.param('eventId'));
    const user = c.get('user');

    // Check event exists
    const event = await c.env.DB.prepare('SELECT * FROM events WHERE id = ? LIMIT 1').bind(eventId).first();

    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    // Check user is registered
    const reg = await c.env.DB.prepare(
      'SELECT id FROM registrations WHERE user_id = ? AND event_id = ? LIMIT 1'
    ).bind(user.userId, eventId).first();

    if (!reg && !user.isAdmin) {
      return c.json({ error: 'You are not registered for this exam' }, 403);
    }

    // Check if already submitted
    const sub = await c.env.DB.prepare(
      'SELECT id FROM submissions WHERE user_id = ? AND event_id = ? LIMIT 1'
    ).bind(user.userId, eventId).first();

    if (sub && !user.isAdmin) {
      return c.json({ error: 'You have already submitted this exam' }, 403);
    }

    // Get questions
    const questionsResult = await c.env.DB.prepare(
      'SELECT id, event_id, subject, question_text, option_a, option_b, option_c, option_d, correct_answer FROM questions WHERE event_id = ?'
    ).bind(eventId).all();
    const questions = questionsResult.results || [];

    if (questions.length === 0) {
      return c.json({ error: 'No questions found for this event' }, 404);
    }

    // Group questions by subject
    const subjectGroups = questions.reduce((acc, q) => {
      const s = q.subject || 'General'
      if (!acc[s]) acc[s] = []
      acc[s].push(q)
      return acc
    }, {})

    // Determine subject order from event.subjects_config
    let subjectOrder = []
    try {
      if (event.subjects_config) {
        const config = JSON.parse(event.subjects_config)
        subjectOrder = Object.keys(config)
      }
    } catch (e) {
      console.warn('Failed to parse subjects_config for sorting:', e)
    }

    // Include any subjects found in questions but not in config
    const allSubjects = [...new Set([...subjectOrder, ...Object.keys(subjectGroups)])]

    // Shuffle within subjects and build final list
    const shuffledQuestions = []
    allSubjects.forEach(s => {
      if (subjectGroups[s]) {
        shuffledQuestions.push(...shuffle(subjectGroups[s]))
      }
    })

    // Shuffle options for each question and remove correct answer
    const studentQuestions = shuffledQuestions.map(q => {
      const shuffled = shuffleOptions(q);
      const { correct_answer, ...studentQ } = shuffled;
      return studentQ;
    });

    return c.json({
      questions: studentQuestions,
      eventId,
      totalQuestions: studentQuestions.length,
      duration: event.duration,
    });

  } catch (e) {
    console.error('Get questions error:', e);
    return c.json({ error: 'Failed to fetch questions' }, 500);
  }
});

// GET /api/questions/:eventId/admin - Get questions with answers (admin)
questionRoutes.get('/questions/:eventId/admin', authMiddleware, adminOnly, async (c) => {
  try {
    const eventId = parseInt(c.req.param('eventId'));
    const questions = await c.env.DB.prepare(
      'SELECT * FROM questions WHERE event_id = ? ORDER BY id'
    ).bind(eventId).all();

    return c.json({ questions: questions.results || [] });

  } catch (e) {
    console.error('Get admin questions error:', e);
    return c.json({ error: 'Failed to fetch questions' }, 500);
  }
});

// POST /api/questions - Add single question (admin)
questionRoutes.post('/questions', authMiddleware, adminOnly, async (c) => {
  try {
    const body = await c.req.json();
    const { event_id, subject, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation } = body;

    if (!event_id || !question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
      return c.json({ error: 'All question fields are required' }, 400);
    }

    if (!['A', 'B', 'C', 'D'].includes(correct_answer.toUpperCase())) {
      return c.json({ error: 'Correct answer must be A, B, C, or D' }, 400);
    }

    const question = await c.env.DB.prepare(
      'INSERT INTO questions (event_id, subject, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *'
    ).bind(
      event_id,
      subject || null,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer.toUpperCase(),
      explanation || null
    ).first();

    return c.json({ success: true, question }, 201);

  } catch (e) {
    console.error('Create question error:', e);
    return c.json({ error: 'Failed to create question' }, 500);
  }
});

// PUT /api/questions/:id - Update question (admin)
questionRoutes.put('/questions/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const questionId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const { subject, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation } = body;

    const updated = await c.env.DB.prepare(
      'UPDATE questions SET subject = ?, question_text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ?, explanation = ? WHERE id = ? RETURNING *'
    ).bind(
      subject || null,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer.toUpperCase(),
      explanation || null,
      questionId
    ).first();

    return c.json({ success: true, question: updated });

  } catch (e) {
    console.error('Update question error:', e);
    return c.json({ error: 'Failed to update question' }, 500);
  }
});

// DELETE /api/questions/:id - Delete question (admin)
questionRoutes.delete('/questions/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const questionId = parseInt(c.req.param('id'));
    await c.env.DB.prepare('DELETE FROM questions WHERE id = ?').bind(questionId).run();
    return c.json({ success: true, message: 'Question deleted' });

  } catch (e) {
    console.error('Delete question error:', e);
    return c.json({ error: 'Failed to delete question' }, 500);
  }
});

// POST /api/questions/bulk - Bulk import from CSV (admin)
questionRoutes.post('/questions/bulk', authMiddleware, adminOnly, async (c) => {
  try {
    const body = await c.req.json();
    const { event_id, questions } = body;

    if (!event_id || !questions || !Array.isArray(questions)) {
      return c.json({ error: 'event_id and questions array are required' }, 400);
    }

    let inserted = 0;
    const errors = [];
    const stmt = c.env.DB.prepare(
      'INSERT INTO questions (event_id, subject, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const batch = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_answer) {
        errors.push(`Row ${i + 1}: Missing required fields`);
        continue;
      }
      if (!['A', 'B', 'C', 'D'].includes(q.correct_answer.toUpperCase())) {
        errors.push(`Row ${i + 1}: Invalid correct_answer (must be A/B/C/D)`);
        continue;
      }
      
      batch.push(stmt.bind(
        event_id,
        q.subject || null,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer.toUpperCase(),
        q.explanation || null
      ));
      inserted++;
    }

    if (batch.length > 0) {
      await c.env.DB.batch(batch);
    }

    return c.json({ success: true, inserted, errors });

  } catch (e) {
    console.error('Bulk import error:', e);
    return c.json({ error: 'Failed to import questions' }, 500);
  }
});
