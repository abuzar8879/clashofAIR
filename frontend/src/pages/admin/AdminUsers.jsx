import React, { useState, useEffect } from 'react'
import { AdminLayout } from './AdminLayout.jsx'
import { adminAPI } from '../../utils/api.js'
import { formatDateTime, getExamTypeBadgeClass, getErrorMessage } from '../../utils/helpers.js'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [attemptsModal, setAttemptsModal] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    loadUsers()
  }, [page, search])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getUsers({ page, limit: 20, search })
      setUsers(res.data.users || [])
      setTotal(res.data.total || 0)
      setTotalPages(res.data.totalPages || 1)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, username) => {
    if (!confirm(`Delete user "${username}"? This will remove all their data.`)) return
    try {
      await adminAPI.deleteUser(id)
      loadUsers()
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  const handleViewAttempts = async (user) => {
    setAttemptsModal(user)
    try {
      const res = await adminAPI.getUserAttempts(user.id)
      setAttempts(res.data.attempts || [])
    } catch (err) {
      setAttempts([])
    }
  }

  return (
    <AdminLayout title="User Management">
      {error && <div className="alert alert-error">{error}</div>}

      {/* Attempts Modal */}
      {attemptsModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '600px' }}>
            <h2 className="modal-title">Test Attempts — {attemptsModal.username}</h2>
            {attempts.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No test attempts yet.</p>
            ) : (
              <div className="table-wrapper" style={{ maxHeight: '400px', overflow: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Type</th>
                      <th>Score</th>
                      <th>Percentile</th>
                      <th>Rank</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map(a => (
                      <tr key={a.id}>
                        <td style={{ fontSize: '13px' }}>{a.event_title}</td>
                        <td>{a.exam_type}</td>
                        <td style={{ fontWeight: '600' }}>{a.score}</td>
                        <td>{a.percentile}</td>
                        <td>#{a.rank}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDateTime(a.submitted_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setAttemptsModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="filter-row">
        <input
          type="text"
          placeholder="Search by username or email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ maxWidth: '320px' }}
        />
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {total} users total
        </span>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="empty-state"><h3>No Users Found</h3></div>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>State</th>
                  <th>Aspirant</th>
                  <th>Admin</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: '500' }}>{user.username}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user.email}</td>
                    <td style={{ fontSize: '13px' }}>{user.state}</td>
                    <td><span className={getExamTypeBadgeClass(user.aspirant_type)}>{user.aspirant_type}</span></td>
                    <td>{user.is_admin ? <i className="fa-solid fa-check" style={{ color: 'var(--success)' }}></i> : '—'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDateTime(user.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                          onClick={() => handleViewAttempts(user)}
                        >
                          Attempts
                        </button>
                        {!user.is_admin && (
                          <button
                            className="btn-danger"
                            style={{ fontSize: '11px', padding: '3px 8px' }}
                            onClick={() => handleDelete(user.id, user.username)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><i className="fa-solid fa-arrow-left"></i> Prev</button>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next <i className="fa-solid fa-arrow-right"></i></button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  )
}
