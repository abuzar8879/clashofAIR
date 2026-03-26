import React from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDate, getExamTypeBadgeClass } from '../utils/helpers.js'
import { Link, useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>Results Center</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              View your latest 5 attempts from one dedicated page.
            </p>
          </div>
          <Link to="/profile/results">
            <button className="btn-primary" style={{ fontSize: '13px' }}>
              View Latest 5 Results <i className="fa-solid fa-arrow-right"></i>
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
