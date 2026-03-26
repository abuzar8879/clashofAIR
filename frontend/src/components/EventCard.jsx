import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDate, formatDuration, getExamTypeBadgeClass, getEventStatus } from '../utils/helpers.js'
import { examAPI } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

export default function EventCard({ event, onRegisterSuccess }) {
  const { user } = useAuth()
  const { showError, showSuccess } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(false)

  const status = getEventStatus(event.date, event.duration)

  const statusLabel = {
    upcoming: { label: <><i className="fa-solid fa-clock"></i> Upcoming</>, color: 'var(--warning)' },
    live: { label: <><i className="fa-solid fa-circle" style={{ color: 'var(--danger)', fontSize: '10px' }}></i> Live</>, color: 'var(--danger)' },
    ended: { label: <><i className="fa-solid fa-circle-check"></i> Ended</>, color: 'var(--text-secondary)' },
  }[status]

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    setLoading(true)
    try {
      await examAPI.register(event.id)
      onRegisterSuccess && onRegisterSuccess(event.id)
      showSuccess('Registered successfully. You can attempt when the exam goes live.')
    } catch (err) {
      showError(err?.response?.data?.error || 'Failed to register')
    } finally {
      setLoading(false)
    }
  }

  const getActionButton = () => {
    if (!user) {
      return (
        <button className="btn-primary" style={{ width: '100%' }} onClick={handleRegister}>
          Register
        </button>
      )
    }

    if (event.isSubmitted) {
      return (
        <Link to={`/events/${event.id}`} style={{ display: 'block' }}>
          <button className="btn-secondary" style={{ width: '100%' }}>View Result</button>
        </Link>
      )
    }

    if (event.isRegistered) {
      if (status === 'live') {
        return (
          <Link to={`/exam/${event.id}`} style={{ display: 'block' }}>
            <button className="btn-primary" style={{ width: '100%', background: 'var(--danger)', borderColor: 'var(--danger)' }}>
              <i className="fa-solid fa-circle" style={{ fontSize: '10px', marginRight: '4px' }}></i> Attempt Now
            </button>
          </Link>
        )
      }
      if (status === 'upcoming') {
        return (
          <button className="btn-secondary" style={{ width: '100%' }} disabled>
            Registered — Exam Not Started
          </button>
        )
      }
      return (
        <Link to={`/events/${event.id}`} style={{ display: 'block' }}>
          <button className="btn-secondary" style={{ width: '100%' }}>View Test</button>
        </Link>
      )
    }

    if (status === 'ended') {
      return (
        <button className="btn-secondary" style={{ width: '100%' }} disabled>
          Exam Ended
        </button>
      )
    }

    return (
      <button className="btn-primary" style={{ width: '100%' }} onClick={handleRegister} disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    )
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <Link to={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', lineHeight: 1.4 }}>
            {event.title}
          </h3>
        </Link>
        <span style={{ color: statusLabel.color, fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
          {statusLabel.label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className={getExamTypeBadgeClass(event.exam_type)}>{event.exam_type}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span><i className="fa-solid fa-calendar-days"></i> Date</span>
          <span style={{ color: 'var(--text)', fontWeight: '500' }}>{formatDate(event.date)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span><i className="fa-solid fa-stopwatch"></i> Duration</span>
          <span style={{ color: 'var(--text)', fontWeight: '500' }}>{formatDuration(event.duration)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span><i className="fa-solid fa-circle-question"></i> Questions</span>
          <span style={{ color: 'var(--text)', fontWeight: '500' }}>{event.question_count}</span>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />

      {getActionButton()}
    </div>
  )
}
