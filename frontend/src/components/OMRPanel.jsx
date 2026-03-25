import React from 'react'

export default function OMRPanel({ questions, answers, markedForReview, currentIndex, onQuestionClick, onSubmit }) {
  const getButtonState = (index, questionId) => {
    if (index === currentIndex) return 'current'
    if (markedForReview.has(questionId)) return 'marked'
    if (answers[questionId]) return 'answered'
    return ''
  }

  const answered = Object.keys(answers).length
  const marked = markedForReview.size
  const unanswered = (questions?.length || 0) - answered

  return (
    <div className="exam-omr-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="omr-title">Question Navigator</div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '6px',
        marginBottom: '16px',
        fontSize: '11px',
      }}>
        <div style={{ background: 'var(--answered-bg)', border: '1px solid var(--answered)', borderRadius: '4px', padding: '6px 4px', textAlign: 'center' }}>
          <div style={{ fontWeight: '700', color: 'var(--answered)', fontSize: '14px' }}>{answered}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>Ans</div>
        </div>
        <div style={{ background: 'var(--unanswered-bg)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px 4px', textAlign: 'center' }}>
          <div style={{ fontWeight: '700', color: 'var(--text)', fontSize: '14px' }}>{unanswered}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>Skip</div>
        </div>
        <div style={{ background: 'var(--marked-bg)', border: '1px solid var(--marked)', borderRadius: '4px', padding: '6px 4px', textAlign: 'center' }}>
          <div style={{ fontWeight: '700', color: 'var(--marked)', fontSize: '14px' }}>{marked}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>Rev</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px 4px', textAlign: 'center' }}>
          <div style={{ fontWeight: '700', color: 'var(--text)', fontSize: '14px' }}>{questions?.length || 0}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>Total</div>
        </div>
      </div>

      {/* Subject-wise Grid */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {Object.entries(
          questions?.reduce((acc, q, i) => {
            const subject = q.subject || 'General'
            if (!acc[subject]) acc[subject] = []
            acc[subject].push({ ...q, index: i })
            return acc
          }, {}) || {}
        ).map(([subject, subQuestions]) => (
          <div key={subject} style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '700',
              color: 'var(--text-secondary)',
              marginBottom: '8px',
              paddingBottom: '4px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>{subject}</span>
              <span style={{ fontWeight: '400', opacity: 0.7 }}>{subQuestions.length} Questions</span>
            </div>
            <div className="omr-grid">
              {subQuestions.map((q, subIdx) => {
                const state = getButtonState(q.index, q.id)
                return (
                  <button
                    key={q.id}
                    className={`omr-btn ${state}`}
                    onClick={() => onQuestionClick(q.index)}
                    title={`Question ${q.index + 1} (${subject})${state === 'answered' ? ' (Answered)' : state === 'marked' ? ' (Marked for Review)' : ''}`}
                  >
                    {subIdx + 1}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        
        {(!questions || questions.length === 0) && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            No questions loaded.
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="omr-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--answered)' }} />
          <span>Answered</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--unanswered)' }} />
          <span>Not Answered</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--marked)' }} />
          <span>Marked for Review</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--current)' }} />
          <span>Current</span>
        </div>
      </div>

      {/* Submit button */}
      <div className="omr-submit">
        <button
          onClick={onSubmit}
          className="btn-danger"
          style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '600' }}
        >
          Submit Exam
        </button>
      </div>
    </div>
  )
}
