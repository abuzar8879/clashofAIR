import React, { useState, useEffect } from 'react'
import { AdminLayout } from './AdminLayout.jsx'
import api, { adminAPI } from '../../utils/api.js'
import { formatDateTime, getExamTypeBadgeClass, getErrorMessage } from '../../utils/helpers.js'
import { useToast } from '../../context/ToastContext.jsx'

export default function AdminResults() {
  const { showError, showSuccess } = useToast()
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)

  useEffect(() => {
    adminAPI.getEvents().then(res => setEvents(res.data.events || [])).catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedEvent) loadResults()
    else { setResults([]); setTotal(0) }
  }, [selectedEvent])

  const loadResults = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getResults({ event_id: selectedEvent, limit: 100 })
      setResults(res.data.results || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }


  const handleExport = () => {
    if (!selectedEvent) return
    api.get(`/admin/export/${selectedEvent}`, { responseType: 'blob' })
      .then(res => res.data)
      .then(blob => {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `results-event-${selectedEvent}.csv`
        link.click()
        URL.revokeObjectURL(link.href)
        showSuccess('CSV exported successfully')
      })
      .catch((err) => showError(getErrorMessage(err) || 'Failed to export CSV'))
  }

  return (
    <AdminLayout title="Results & Leaderboards">
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Event selector */}
      <div className="filter-row">
        <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)} style={{ maxWidth: '360px' }}>
          <option value="">-- Select Test --</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title} ({ev.exam_type})</option>
          ))}
        </select>
        {selectedEvent && (
          <>
            <button
              className="btn-secondary"
              onClick={handleExport}
            >
              <i className="fa-solid fa-download"></i> Export CSV
            </button>
          </>
        )}
      </div>

      {!selectedEvent ? (
        <div className="empty-state">
          <h3>Select a Test</h3>
          <p>Choose a test to view its results and manage the leaderboard.</p>
        </div>
      ) : loading ? (
        <div className="loading">Loading results...</div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <h3>No Submissions Yet</h3>
          <p>No one has submitted this test yet.</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {total} submissions
          </p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Username</th>
                  <th>State</th>
                  <th>Aspirant</th>
                  <th>Score</th>
                  <th>Percentile</th>
                  <th>Correct</th>
                  <th>Incorrect</th>
                  <th>Time (min)</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, index) => {
                  const displayRank = index + 1
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: '700' }}>
                        {displayRank === 1 && <i className="fa-solid fa-medal" style={{ color: '#FFD700', marginRight: '4px' }}></i>}
                        {displayRank === 2 && <i className="fa-solid fa-medal" style={{ color: '#C0C0C0', marginRight: '4px' }}></i>}
                        {displayRank === 3 && <i className="fa-solid fa-medal" style={{ color: '#CD7F32', marginRight: '4px' }}></i>}
                        #{displayRank}
                      </td>
                    <td style={{ fontWeight: '500' }}>{r.username}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.state}</td>
                    <td><span className={getExamTypeBadgeClass(r.aspirant_type)}>{r.aspirant_type}</span></td>
                    <td style={{ fontWeight: '600' }}>{r.score}</td>
                    <td>
                      <span style={{
                        background: r.percentile >= 90 ? 'var(--success-bg)' : 'var(--bg-secondary)',
                        color: r.percentile >= 90 ? 'var(--success)' : 'var(--text)',
                        padding: '2px 8px', borderRadius: '3px', fontSize: '13px', fontWeight: '600',
                      }}>{r.percentile}</span>
                    </td>
                    <td style={{ color: 'var(--answered)' }}>{r.correct_count}</td>
                    <td style={{ color: 'var(--danger)' }}>{r.incorrect_count}</td>
                    <td>{Math.round(r.time_taken / 60)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDateTime(r.submitted_at)}</td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
