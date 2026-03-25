import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const NAV_ITEMS = [
  { path: '/admin', label: <><i className="fa-solid fa-chart-simple"></i> Dashboard</>, exact: true },
  { path: '/admin/events', label: <><i className="fa-solid fa-calendar-days"></i> Tests</> },
  { path: '/admin/questions', label: <><i className="fa-solid fa-circle-question"></i> Questions</> },
  { path: '/admin/users', label: <><i className="fa-solid fa-users"></i> Users</> },
  { path: '/admin/results', label: <><i className="fa-solid fa-trophy"></i> Results</> },
]

export function AdminLayout({ children, title }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="admin-sidebar-logo">
          clashofAIR
          <span>Admin Panel</span>
        </div>

        <nav>
          {NAV_ITEMS.map(({ path, label, exact }) => {
            const isActive = exact ? location.pathname === path : location.pathname.startsWith(path)
            return (
              <Link key={path} to={path} className={`admin-nav-link ${isActive ? 'active' : ''}`}>
                {label}
              </Link>
            )
          })}
        </nav>

        <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, padding: '0 20px' }}>
          <Link to="/" style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textDecoration: 'none' }}>
            <i className="fa-solid fa-arrow-left"></i> View Site
          </Link>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none',
              color: 'var(--danger)', fontSize: '13px',
              cursor: 'pointer', padding: 0,
            }}
          >
            <i className="fa-solid fa-right-from-bracket"></i> Logout ({user?.username})
          </button>
        </div>
      </div>

      <main className="admin-main">
        {title && <h1 className="admin-page-title">{title}</h1>}
        {children}
      </main>
    </div>
  )
}
