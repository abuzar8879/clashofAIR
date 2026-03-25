import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'
import { getErrorMessage } from '../utils/helpers.js'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-client-id'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const successMsg = location.state?.message

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!identifier || !password) {
      setError('Please enter username/email and password')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await authAPI.login({ identifier, password })
      login(res.data.user)
      navigate(res.data.user?.isAdmin ? '/admin' : '/')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const credential = credentialResponse?.credential
      if (!credential) {
        setError('Google login failed. Missing credential.')
        return
      }

      const res = await authAPI.googleOAuth({ credential })

      if (res.data.needsProfile) {
        navigate('/register', {
          state: {
            googleData: {
              ...res.data,
              credential,
            },
          },
        })
        return
      }

      login(res.data.user)
      navigate(res.data.user?.isAdmin ? '/admin' : '/')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="auth-page">
        <div className="auth-box">
          <div className="auth-logo">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <h1>clashofAIR</h1>
            </Link>
            <p>Compete. Learn. Rank.</p>
          </div>

          {successMsg && <div className="alert alert-success" style={{ marginBottom: '16px' }}>{successMsg}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="identifier">Username or Email</label>
              <input
                id="identifier"
                type="text"
                placeholder="Enter username or email"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '11px', fontSize: '14px' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider">or</div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google login failed. Please try again.')}
            />
          </div>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '20px' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--text)', fontWeight: '600', textDecoration: 'underline' }}>
              Register here
            </Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Demo admin: admin@clashofAIR.com / Admin@123
          </p>
        </div>
      </div>
    </GoogleOAuthProvider>
  )
}
