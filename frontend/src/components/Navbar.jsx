import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setNavOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: '56px',
      background: 'var(--navbar-bg)',
      borderBottom: '1px solid var(--navbar-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/" style={{
        fontSize: '18px',
        fontWeight: '700',
        color: 'var(--text)',
        textDecoration: 'none',
        flexShrink: 0,
        marginRight: '20px',
      }}>
        clashofAIR
      </Link>

      {/* Center Nav */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flex: 1,
        justifyContent: 'center',
      }} className={`navbar-center-links${navOpen ? ' open' : ''}`}>
        {[
          { path: '/', label: 'Home' },
          { path: '/events', label: 'Tests' },
          { path: '/about', label: 'About Us' },
        ].map(({ path, label }) => (
          <Link key={path} to={path} style={{
            padding: '6px 14px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            color: location.pathname === path ? 'var(--text)' : 'var(--text-secondary)',
            background: location.pathname === path ? 'var(--bg-secondary)' : 'transparent',
            textDecoration: 'none',
            transition: 'color 0.15s, background 0.15s',
            whiteSpace: 'nowrap',
          }}>
            {label}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          type="button"
          className="navbar-mobile-toggle"
          onClick={() => setNavOpen(v => !v)}
          aria-label="Toggle navigation"
        >
          <i className={`fa-solid ${navOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '5px 8px',
            cursor: 'pointer',
            color: 'var(--text)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
          }}
        >
          {theme === 'dark' ? <i className="fa-solid fa-sun"></i> : <i className="fa-solid fa-moon"></i>}
        </button>

        {user ? (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'var(--btn-bg)',
                color: 'var(--btn-text)',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 14px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: 'var(--btn-text)', color: 'var(--btn-bg)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: '700'
              }}>
                {user.username?.[0]?.toUpperCase()}
              </span>
              {user.username}
              <span style={{ fontSize: '10px' }}><i className="fa-solid fa-caret-down"></i></span>
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                minWidth: '160px',
                boxShadow: '0 4px 12px var(--shadow)',
                zIndex: 200,
                overflow: 'hidden',
              }}>
                {!user.isAdmin && (
                  <Link to="/profile"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '10px 16px',
                      fontSize: '14px',
                      color: 'var(--text)',
                      textDecoration: 'none',
                      borderBottom: '1px solid var(--border)',
                    }}>
                    <i className="fa-solid fa-user"></i> My Profile
                  </Link>
                )}
                {user.isAdmin && (
                  <Link to="/admin"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '10px 16px',
                      fontSize: '14px',
                      color: 'var(--text)',
                      textDecoration: 'none',
                      borderBottom: '1px solid var(--border)',
                    }}>
                    <i className="fa-solid fa-gear"></i> Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    fontSize: '14px',
                    color: 'var(--danger)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}>
                  <i className="fa-solid fa-right-from-bracket"></i> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/register" style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text)',
              textDecoration: 'none',
              padding: '6px 12px',
            }}>
              Register
            </Link>
            <Link to="/login" style={{
              background: 'var(--btn-bg)',
              color: 'var(--btn-text)',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}>
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
