import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { eventsAPI, examAPI } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import Leaderboard from '../components/Leaderboard.jsx'
import ResultCard from '../components/ResultCard.jsx'
import { formatDateTime, formatDuration, getEventStatus, getExamTypeBadgeClass } from '../utils/helpers.js'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('questions')
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    loadEvent()
  }, [id])

  const loadEvent = async () => {
    setLoading(true)
    try {
      const res = await eventsAPI.getById(id)
      setEvent(res.data)
    } catch (err) {
      setError(err?.response?.data?.error || 'Test not found')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!user) { navigate('/login'); return }
    setRegistering(true)
    try {
      await examAPI.register(Number(id))
      await loadEvent()
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to register')
    } finally {
      setRegistering(false)
    }
  }

  if (loading) return <div className="loading">Loading test...</div>
  if (error) return (
    <div className="page-content">
      <div className="alert alert-error">{error}</div>
      <Link to="/events" className="btn-secondary"><i className="fa-solid fa-arrow-left"></i> Back to Events</Link>
    </div>
  )
  if (!event) return null

  const status = getEventStatus(event.date, event.duration)
  const statusLabels = {
    upcoming: { text: <><i className="fa-solid fa-clock"></i> Upcoming</>, color: 'var(--warning)' },
    live: { text: <><i className="fa-solid fa-circle" style={{ color: 'var(--danger)', fontSize: '10px' }}></i> Live Now</>, color: 'var(--danger)' },
    ended: { text: <><i className="fa-solid fa-circle-check"></i> Ended</>, color: 'var(--text-secondary)' },
  }
  const sl = statusLabels[status]

  const renderQuestionsTab = () => {
    if (!user) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3 style={{ marginBottom: '12px' }}>Login to Register for This Exam</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
            You need an account to register and attempt this mock test.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/login"><button className="btn-primary">Login</button></Link>
            <Link to="/register"><button className="btn-secondary">Register</button></Link>
          </div>
        </div>
      )
    }

    if (event.isSubmitted) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--success)' }}><i className="fa-solid fa-circle-check"></i></div>
          <h3 style={{ marginBottom: '8px' }}>Exam Submitted Successfully</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
            You have already submitted this exam. View your result in the Result tab.
          </p>
          <button className="btn-primary" onClick={() => setActiveTab('result')}>
            View Result <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      )
    }

    if (!event.isRegistered) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--primary)' }}><i className="fa-solid fa-file-pen"></i></div>
          <h3 style={{ marginBottom: '8px' }}>{event.title}</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Register now to participate in this mock exam. The exam will start at the scheduled time.
          </p>
          {status === 'ended' ? (
            <button className="btn-secondary" disabled>Exam Ended — Registration Closed</button>
          ) : (
            <button className="btn-primary" onClick={handleRegister} disabled={registering}>
              {registering ? 'Registering...' : 'Register for This Exam'}
            </button>
          )}
        </div>
      )
    }

    // Registered
    if (status === 'upcoming') {
      const start = new Date(event.date)
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--warning)' }}><i className="fa-solid fa-clock"></i></div>
          <h3 style={{ marginBottom: '8px' }}>You're Registered!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '14px' }}>
            Exam starts at: <strong>{formatDateTime(event.date)}</strong>
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Come back when the exam begins. Keep this page open.
          </p>
        </div>
      )
    }

    if (status === 'live') {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--danger)' }}><i className="fa-solid fa-circle"></i></div>
          <h3 style={{ marginBottom: '8px' }}>Exam Is Live Now!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            The exam is in progress. Click below to enter the exam interface.
          </p>
          <Link to={`/exam/${event.id}`}>
            <button className="btn-primary" style={{ padding: '12px 28px', fontSize: '15px', background: 'var(--danger)', borderColor: 'var(--danger)' }}>
              <i className="fa-solid fa-circle" style={{ fontSize: '10px', marginRight: '4px' }}></i> Enter Exam Now
            </button>
          </Link>
        </div>
      )
    }

    // Ended + registered but not submitted
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--text-secondary)' }}><i className="fa-solid fa-flag-checkered"></i></div>
        <h3 style={{ marginBottom: '8px' }}>Exam Has Ended</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          You did not submit this exam. The exam period has passed.
        </p>
      </div>
    )
  }

  return (
    <div className="page-content">
      {/* Back button */}
      <Link to="/events" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
        <i className="fa-solid fa-arrow-left"></i> Back to Tests
      </Link>

      {/* Event Header */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>{event.title}</h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={getExamTypeBadgeClass(event.exam_type)}>{event.exam_type}</span>
              <span style={{ color: sl.color, fontSize: '13px', fontWeight: '600' }}>{sl.text}</span>
            </div>
          </div>
        </div>
        <hr className="divider" />
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-secondary)' }}><i className="fa-solid fa-calendar-days"></i> <strong style={{ color: 'var(--text)' }}>{formatDateTime(event.date)}</strong></span>
          <span style={{ color: 'var(--text-secondary)' }}><i className="fa-solid fa-stopwatch"></i> <strong style={{ color: 'var(--text)' }}>{formatDuration(event.duration)}</strong></span>
          <span style={{ color: 'var(--text-secondary)' }}><i className="fa-solid fa-circle-question"></i> <strong style={{ color: 'var(--text)' }}>{event.question_count} Questions</strong></span>
          <span style={{ color: 'var(--text-secondary)' }}><i className="fa-solid fa-users"></i> <strong style={{ color: 'var(--text)' }}>{event.participant_count || 0} Registered</strong></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { key: 'questions', label: 'Questions' },
          { key: 'leaderboard', label: 'Leaderboard' },
          { key: 'result', label: 'Result' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`tab-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'questions' && renderQuestionsTab()}
        {activeTab === 'leaderboard' && <Leaderboard eventId={Number(id)} />}
        {activeTab === 'result' && (
          user ? <ResultCard eventId={Number(id)} /> : (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Please <Link to="/login" style={{ color: 'var(--text)', textDecoration: 'underline' }}>login</Link> to view your result.</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
