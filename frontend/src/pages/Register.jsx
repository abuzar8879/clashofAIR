import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { INDIAN_STATES, ASPIRANT_TYPES, getErrorMessage } from '../utils/helpers.js'

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const googleData = location.state?.googleData

  const [form, setForm] = useState({
    username: '',
    email: googleData?.email || '',
    state: '',
    aspirant_type: '',
    password: '',
    confirm_password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const validate = () => {
    if (!form.username || !form.email || !form.state || !form.aspirant_type) {
      return 'Please fill in all required fields'
    }
    if (form.username.length < 6 || form.username.length > 12) return 'Username must be 6-12 characters'
    if (!/^[a-zA-Z0-9_\-@]+$/.test(form.username)) return 'Username: alphanumeric, _, -, @ mapping'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email address'
    if (!googleData) {
      if (!form.password) return 'Password is required'
      if (form.password.length < 8) return 'Password must be at least 8 characters'
      if (form.password !== form.confirm_password) return 'Passwords do not match'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError('')
    try {
      let res
      if (googleData) {
        if (!googleData.credential) {
          setError('Google session expired. Please sign in with Google again.')
          return
        }
        res = await authAPI.googleOAuth({
          credential: googleData.credential,
          state: form.state,
          aspirant_type: form.aspirant_type,
        })
      } else {
        res = await authAPI.register(form)
      }
      navigate('/login', { state: { message: 'Registration successful! Please sign in with your new account.' } })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box" style={{ maxWidth: '480px' }}>
        <div className="auth-logo">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1>clashofAIR</h1>
          </Link>
          <p>Create your account to start competing</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label htmlFor="username">Username *</label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="e.g. rahul_jee"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                disabled={!!googleData?.email}
                required
              />
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label htmlFor="state">State *</label>
              <select id="state" name="state" value={form.state} onChange={handleChange} required>
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label htmlFor="aspirant_type">Aspirant Type *</label>
              <select id="aspirant_type" name="aspirant_type" value={form.aspirant_type} onChange={handleChange} required>
                <option value="">Select Exam</option>
                {ASPIRANT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {!googleData && (
            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label htmlFor="confirm_password">Confirm Password *</label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  placeholder="Repeat password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '11px', fontSize: '14px' }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '20px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--text)', fontWeight: '600', textDecoration: 'underline' }}>
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
