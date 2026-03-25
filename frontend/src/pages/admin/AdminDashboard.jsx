import React, { useState, useEffect } from 'react'
import { AdminLayout } from './AdminLayout.jsx'
import { adminAPI } from '../../utils/api.js'
import { formatDateTime } from '../../utils/helpers.js'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => setData(res.data))
      .catch(err => console.error('Dashboard error:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="loading">Loading dashboard...</div>
      ) : !data ? (
        <div className="alert alert-error">Failed to load dashboard</div>
      ) : (
        <>
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{data.stats.totalUsers}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{data.stats.totalEvents}</div>
              <div className="stat-label">Total Tests</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{data.stats.totalSubmissions}</div>
              <div className="stat-label">Submissions</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: 'var(--danger)' }}>{data.stats.activeEvents}</div>
              <div className="stat-label">Live Tests</div>
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
            <Link to="/admin/events"><button className="btn-primary">+ Create Test</button></Link>
            <Link to="/admin/questions"><button className="btn-secondary">+ Add Questions</button></Link>
            <Link to="/admin/users"><button className="btn-secondary">Manage Users</button></Link>
          </div>

          {/* Recent Events */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px' }}>Recent Tests</h2>
            {data.recentEvents?.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No tests yet.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Duration</th>
                      <th>Questions</th>
                      <th>Visible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentEvents?.map(event => (
                      <tr key={event.id}>
                        <td style={{ fontWeight: '500' }}>{event.title}</td>
                        <td>{event.exam_type}</td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDateTime(event.date)}</td>
                        <td>{event.duration} min</td>
                        <td>{event.question_count}</td>
                        <td>{event.is_visible ? <i className="fa-solid fa-check" style={{ color: 'var(--success)' }}></i> : <i className="fa-solid fa-xmark" style={{ color: 'var(--danger)' }}></i>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px' }}>Recent Submissions</h2>
            {data.recentSubmissions?.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No submissions yet.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Test</th>
                      <th>Score</th>
                      <th>Percentile</th>
                      <th>Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentSubmissions?.map(sub => (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: '500' }}>{sub.username}</td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{sub.event_title}</td>
                        <td style={{ fontWeight: '600' }}>{sub.score}</td>
                        <td>{sub.percentile}</td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDateTime(sub.submitted_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  )
}
