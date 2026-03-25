import React, { useState, useEffect } from 'react'
import { eventsAPI } from '../utils/api.js'
import EventCard from '../components/EventCard.jsx'
import { EXAM_TYPES } from '../utils/helpers.js'

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    fetchEvents()
  }, [filter])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const params = filter !== 'All' ? { exam_type: filter } : {}
      const res = await eventsAPI.getAll(params)
      setEvents(res.data.events || [])
    } catch (err) {
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title" style={{ marginBottom: '4px' }}>Mock Exam Tests</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Register and compete in scheduled mock tests. Results and percentile after exam ends.
        </p>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {['All', ...EXAM_TYPES].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            style={{
              padding: '6px 14px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              background: filter === type ? 'var(--btn-bg)' : 'var(--bg-secondary)',
              color: filter === type ? 'var(--btn-text)' : 'var(--text)',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading tests...</div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <h3>No Tests Found</h3>
          <p>No mock tests available for {filter} right now. Check back soon!</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onRegisterSuccess={fetchEvents}
            />
          ))}
        </div>
      )}
    </div>
  )
}
