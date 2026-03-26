import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { resultsAPI } from '../utils/api.js'
import { formatDateTime, formatDuration, getExamTypeBadgeClass } from '../utils/helpers.js'

export default function ProfileResults() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadLatestResults()
  }, [])

  const loadLatestResults = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await resultsAPI.getMyResults(5)
      setResults(res.data.results || [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load latest results')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-content">
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <div style={{ marginBottom: '18px' }}>
          <Link to="/profile" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            <i className="fa-solid fa-arrow-left"></i> Back to Profile
          </Link>
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Latest Results</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Showing your latest 5 submitted exams.
          </p>
        </div>

        {loading ? (
          <div className="loading">Loading latest results...</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <h3>No Results Yet</h3>
            <p>Attempt and submit an exam to view your performance history.</p>
            <Link to="/events" style={{ marginTop: '14px', display: 'inline-block' }}>
              <button className="btn-primary">Browse Tests <i className="fa-solid fa-arrow-right"></i></button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {results.map((entry, idx) => (
              <div key={`${entry.event?.id}-${entry.result?.submittedAt}-${idx}`} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '5px' }}>
                      {entry.event?.title || 'Untitled Event'}
                    </h3>
                    <span className={getExamTypeBadgeClass(entry.event?.exam_type)}>{entry.event?.exam_type}</span>
                  </div>

                  <Link to={`/events/${entry.event?.id}`}>
                    <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                      Open Result
                    </button>
                  </Link>
                </div>

                <hr className="divider" />

                <div style={{ display: 'flex', gap: '22px', flexWrap: 'wrap', fontSize: '13px' }}>
                  <span><strong>{entry.result?.score}/{entry.result?.totalQuestions}</strong> <span style={{ color: 'var(--text-secondary)' }}>Score</span></span>
                  <span><strong style={{ color: 'var(--current)' }}>{entry.result?.percentile}</strong> <span style={{ color: 'var(--text-secondary)' }}>Percentile</span></span>
                  <span><strong>#{entry.result?.rank}</strong> <span style={{ color: 'var(--text-secondary)' }}>Rank</span></span>
                  <span><strong>{entry.result?.correctCount}</strong> <span style={{ color: 'var(--text-secondary)' }}>Correct</span></span>
                  <span><strong>{entry.result?.incorrectCount}</strong> <span style={{ color: 'var(--text-secondary)' }}>Incorrect</span></span>
                </div>

                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                  <span><i className="fa-solid fa-calendar-days"></i> Exam: <strong style={{ color: 'var(--text)' }}>{formatDateTime(entry.event?.date)}</strong></span>
                  <span><i className="fa-solid fa-stopwatch"></i> Duration: <strong style={{ color: 'var(--text)' }}>{formatDuration(entry.event?.duration)}</strong></span>
                  <span><i className="fa-solid fa-clock"></i> Submitted: <strong style={{ color: 'var(--text)' }}>{formatDateTime(entry.result?.submittedAt)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
