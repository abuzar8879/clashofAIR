import React, { useEffect, useState } from 'react'
import { resultsAPI } from '../utils/api.js'
import { formatDuration, formatDateTime } from '../utils/helpers.js'

export default function ResultCard({ eventId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    resultsAPI.getResult(eventId)
      .then(res => setData(res.data))
      .catch(err => setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to load result'))
      .finally(() => setLoading(false))
  }, [eventId])

  if (loading) return <div className="loading">Loading result...</div>
  if (error) return <div className="alert alert-error">{error}</div>
  if (!data) return null

  if (!data.resultAvailable) {
    // Destructure event from data if it exists, for the new details
    const { event } = data;

    return (
      <div style={{ textAlign: 'center', padding: '48px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--warning)' }}><i className="fa-solid fa-hourglass-half"></i></div>
        <h3 style={{ marginBottom: '8px' }}>Result Not Available Yet</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
          {data.message}
        </p>
        {event && ( // Only show event details if event data is available
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontSize: '14px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><i className="fa-solid fa-calendar-days"></i> Date</span>
              <span style={{ color: 'var(--text)', fontWeight: '500' }}>{formatDate(event.date)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><i className="fa-solid fa-stopwatch"></i> Duration</span>
              <span style={{ color: 'var(--text)', fontWeight: '500' }}>{formatDuration(event.duration)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><i className="fa-solid fa-circle-question"></i> Questions</span>
              <span style={{ color: 'var(--text)', fontWeight: '500' }}>{event.question_count}</span>
            </div>
          </div>
        )}
        {data.endsAt && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>
            Exam ends: {formatDateTime(data.endsAt)}
          </p>
        )}
      </div>
    )
  }

  const { result, event } = data
  const scorePercent = Math.round((result.score / result.totalQuestions) * 100)

  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Your Result</h3>

      {/* Score banner */}
      <div style={{
        background: result.percentile >= 90 ? 'var(--success-bg)' : 'var(--bg-secondary)',
        border: `1px solid ${result.percentile >= 90 ? 'var(--success)' : 'var(--border)'}`,
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        marginBottom: '24px',
      }}>
        <div style={{ fontSize: '36px', fontWeight: '700', color: result.percentile >= 90 ? 'var(--success)' : 'var(--text)' }}>
          {result.score} / {result.totalQuestions}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          {scorePercent}% Score
        </div>
      </div>

      {/* Metrics grid */}
      <div className="result-grid">
        <div className="result-metric">
          <div className="value" style={{ color: 'var(--current)' }}>{result.percentile}</div>
          <div className="label">Percentile</div>
        </div>
        <div className="result-metric">
          <div className="value">#{result.rank}</div>
          <div className="label">Rank</div>
        </div>
        <div className="result-metric">
          <div className="value" style={{ color: 'var(--answered)' }}>{result.correctCount}</div>
          <div className="label">Correct</div>
        </div>
        <div className="result-metric">
          <div className="value" style={{ color: 'var(--danger)' }}>{result.incorrectCount}</div>
          <div className="label">Incorrect</div>
        </div>
        <div className="result-metric">
          <div className="value" style={{ color: 'var(--text-secondary)' }}>{result.unattempted}</div>
          <div className="label">Unattempted</div>
        </div>
        <div className="result-metric">
          <div className="value">{result.totalParticipants}</div>
          <div className="label">Total Participants</div>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '16px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
      }}>
        <span><i className="fa-solid fa-stopwatch"></i> Time Taken: <strong style={{ color: 'var(--text)' }}>{formatDuration(Math.round(result.timeTaken / 60))}</strong></span>
        <span><i className="fa-solid fa-calendar-check"></i> Submitted: <strong style={{ color: 'var(--text)' }}>{formatDateTime(result.submittedAt)}</strong></span>
        <span><i className="fa-solid fa-trophy"></i> Rank: <strong style={{ color: 'var(--text)' }}>#{result.rank} out of {result.totalParticipants}</strong></span>
      </div>
    </div>
  )
}
