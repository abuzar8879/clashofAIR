// ============================================================
// Percentile Calculation Utility
// ============================================================

export async function recalculatePercentileAndRank(db, eventId) {
  try {
    const subsResult = await db.prepare(
      'SELECT id, score FROM submissions WHERE event_id = ? ORDER BY score DESC, submitted_at ASC'
    ).bind(eventId).all();
    
    const subs = subsResult.results || [];
    if (subs.length === 0) return;

    const total = subs.length;
    const sortedScores = [...subs.map(s => s.score)].sort((a, b) => a - b);
    
    const stmt = db.prepare('UPDATE submissions SET percentile = ?, rank = ? WHERE id = ?');
    const batch = [];

    for (let i = 0; i < subs.length; i++) {
      const sub = subs[i];
      // Percentile: (number of scores below / total) * 100
      const below = sortedScores.filter(s => s < sub.score).length;
      const percentile = total === 1 ? 100 : Math.round((below / total) * 1000) / 10;
      
      // Sequential rank: 1, 2, 3...
      const rank = i + 1;
      
      batch.push(stmt.bind(percentile, rank, sub.id));
    }

    if (batch.length > 0) {
      await db.batch(batch);
    }
  } catch (err) {
    console.error('Recalculate error:', err);
  }
}

/**
 * Calculate score from submitted answers
 */
export function calculateScore(questions, answers) {
  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;

  for (const question of questions) {
    const selectedOption = answers[question.id];
    if (!selectedOption) {
      unattempted++;
    } else if (selectedOption === question.correct_answer) {
      correct++;
    } else {
      incorrect++;
    }
  }

  return { correct, incorrect, unattempted, score: correct };
}
