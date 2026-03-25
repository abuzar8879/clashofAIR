import React, { useState, useEffect } from 'react'
import { resultsAPI } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Leaderboard({ eventId }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchLeaderboard(page)
  }, [eventId, page])

  const fetchLeaderboard = async (p) => {
    setLoading(true)
    try {
      const res = await resultsAPI.getLeaderboard(eventId, { page: p, limit: 50 })
      setData(res.data)
    } catch (err) {
      if (err?.response?.status === 403 && err.response.data.error === 'Leaderboard Reveal') {
        setData({ locked: true, message: err.response.data.message })
      } else {
        setError(err?.response?.data?.error || 'Failed to load leaderboard')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading leaderboard...</div>
  if (error) return <div className="alert alert-error">{error}</div>
  if (!data) return null

  if (data.locked) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-secondary)', border: '1px dashed var(--border)' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px', color: 'var(--warning)' }}>
          <i className="fa-solid fa-clock-rotate-left"></i>
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Leaderboard Reveal</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{data.message}</p>
      </div>
    )
  }

  const { leaderboard, totalParticipants, userEntry } = data

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Leaderboard</h3>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {totalParticipants} Participants
        </span>
      </div>

      {/* Current user highlight */}
      {userEntry && (
        <div style={{
          background: 'var(--highlight-row)',
          border: '1px solid var(--current)',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '14px',
        }}>
          <span style={{ fontWeight: '600' }}>Your Rank: #{userEntry.rank}</span>
          <span>Score: {userEntry.score}</span>
          <span>Percentile: {userEntry.percentile}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{userEntry.state}</span>
        </div>
      )}

      {leaderboard.length === 0 ? (
        <div className="empty-state">
          <p>No submissions yet. Be the first to attempt this exam!</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th>Username</th>
                <th>Score</th>
                <th>Percentile</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => {
                const displayRank = (page - 1) * 50 + index + 1
                return (
                  <tr
                    key={entry.user_id}
                    className={entry.isCurrentUser ? 'current-user-row' : ''}
                    style={entry.isCurrentUser ? { fontWeight: '600' } : {}}
                  >
                    <td>
                      {displayRank === 1 && <i className="fa-solid fa-medal" style={{ color: '#FFD700', marginRight: '4px' }}></i>}
                      {displayRank === 2 && <i className="fa-solid fa-medal" style={{ color: '#C0C0C0', marginRight: '4px' }}></i>}
                      {displayRank === 3 && <i className="fa-solid fa-medal" style={{ color: '#CD7F32', marginRight: '4px' }}></i>}
                      #{displayRank}
                    </td>
                  <td>
                    {entry.username}
                    {entry.isCurrentUser && (
                      <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--current)', fontWeight: '600' }}>
                        (You)
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: '600' }}>{entry.score}</td>
                  <td>
                    <span style={{
                      background: entry.percentile >= 90 ? 'var(--success-bg)' : 'var(--bg-secondary)',
                      color: entry.percentile >= 90 ? 'var(--success)' : 'var(--text)',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      {entry.percentile}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{entry.state}</td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalParticipants > 50 && (
        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <i className="fa-solid fa-arrow-left"></i> Prev
          </button>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Page {page}
          </span>
          <button onClick={() => setPage(p => p + 1)} disabled={leaderboard.length < 50}>
            Next <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      )}
    </div>
  )
}
