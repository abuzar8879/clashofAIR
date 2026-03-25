import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { resultsAPI, eventsAPI } from '../utils/api.js'
import { formatDateTime, formatDate, getExamTypeBadgeClass } from '../utils/helpers.js'
import { Link, useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load user's recent submissions
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Get events to find submitted ones
      const eventsRes = await eventsAPI.getAll({})
      const events = eventsRes.data.events || []
      const submittedEvents = events.filter(e => e.isSubmitted)

      // Get results for each submitted event
      const results = await Promise.all(
        submittedEvents.slice(0, 5).map(async (event) => {
          try {
            const res = await resultsAPI.getResult(event.id)
            return { ...res.data, event }
          } catch (e) {
            return null
          }
        })
      )
      setSubmissions(results.filter(Boolean))
    } catch (e) {
      console.error('Failed to load profile data:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="page-content">
      <div className="profile-page" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Profile header */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'var(--btn-bg)', color: 'var(--btn-text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', fontWeight: '700',
              }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{user?.username}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{user?.email}</p>
              </div>
            </div>
            <button className="btn-secondary" onClick={handleLogout} style={{ fontSize: '13px' }}>
              Logout
            </button>
          </div>

          <hr className="divider" />

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '14px' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>State: </span>
              <strong>{user?.state}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Aspirant: </span>
              <span className={getExamTypeBadgeClass(user?.aspirant_type)}>{user?.aspirant_type}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Member since: </span>
              <strong>{formatDate(user?.created_at)}</strong>
            </div>
          </div>
        </div>

        {/* Recent exam history */}
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Recent Exam History</h3>

        {loading ? (
          <div className="loading">Loading exam history...</div>
        ) : submissions.length === 0 ? (
          <div className="empty-state">
            <h3>No Exams Attempted Yet</h3>
            <p>Participate in a mock exam to see your results here.</p>
            <Link to="/events" style={{ marginTop: '16px', display: 'inline-block' }}>
              <button className="btn-primary">Browse Tests <i className="fa-solid fa-arrow-right"></i></button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {submissions.map((sub, i) => {
              if (!sub.resultAvailable || !sub.result) return null
              return (
                <div key={i} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
                        {sub.event?.title}
                      </h4>
                      <span className={getExamTypeBadgeClass(sub.event?.exam_type)}>{sub.event?.exam_type}</span>
                    </div>
                    <Link to={`/events/${sub.event?.id}`}>
                      <button className="btn-secondary" style={{ fontSize: '12px', padding: '5px 12px' }}>
                        View Details
                      </button>
                    </Link>
                  </div>
                  <hr className="divider" />
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px' }}>
                    <span><strong style={{ color: 'var(--text)' }}>{sub.result.score}/{sub.result.totalQuestions}</strong> <span style={{ color: 'var(--text-secondary)' }}>Score</span></span>
                    <span><strong style={{ color: 'var(--current)' }}>{sub.result.percentile}</strong> <span style={{ color: 'var(--text-secondary)' }}>Percentile</span></span>
                    <span><strong>#{sub.result.rank}</strong> <span style={{ color: 'var(--text-secondary)' }}>Rank</span></span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
