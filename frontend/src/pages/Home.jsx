import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { eventsAPI } from '../utils/api.js'
import EventCard from '../components/EventCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const EXAM_TRACKS = [
  { code: 'JEE-MAINS', line: 'Engineering Entrance' },
  { code: 'JEE-ADV', line: 'IIT Advanced' },
  { code: 'NEET', line: 'Medical Entrance' },
  { code: 'MHT-CET', line: 'State CET' },
]

const WORKFLOW = [
  {
    step: '01',
    title: 'Create Profile',
    desc: 'Set your aspirant type once and unlock exam-matched test recommendations.',
  },
  {
    step: '02',
    title: 'Attempt Under Pressure',
    desc: 'Write timed tests with anti-cheat protection and realistic CBT exam behavior.',
  },
  {
    step: '03',
    title: 'Track Rank and Percentile',
    desc: 'See live competition outcomes and your final standing after exam close.',
  },
]

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    eventsAPI.getAll({ limit: 6 })
      .then(res => setUpcomingEvents(res.data.events || []))
      .catch(() => setUpcomingEvents([]))
      .finally(() => setLoading(false))
  }, [])

  const featuredEvents = useMemo(
    () => upcomingEvents
      .filter(event => event.status !== 'ended')
      .slice(0, 3),
    [upcomingEvents]
  )

  const secondaryHeroAction = useMemo(() => {
    if (authLoading) return { to: '/events', label: 'Checking account...', disabled: true }
    if (!user) return { to: '/register', label: 'Create Free Account' }
    if (user.isAdmin) return { to: '/admin', label: 'Open Admin Dashboard' }
    return { to: '/profile', label: 'View Profile' }
  }, [authLoading, user])

  const ctaAction = useMemo(() => {
    if (authLoading) return { to: '/events', label: 'Loading account...', disabled: true }
    if (user) return { to: '/events', label: 'Go to My Tests' }
    return { to: '/register', label: 'Get Started Free' }
  }, [authLoading, user])

  return (
    <main className="home-shell">
      <section className="home-hero">
        <div className="home-hero-glow home-hero-glow-one"></div>
        <div className="home-hero-glow home-hero-glow-two"></div>
        <div className="home-container">
          <div className="home-badge-row">
            <span className="home-badge">National Mock Platform</span>
            {user && <span className="home-badge home-badge-soft">Welcome back, {user.username}</span>}
          </div>
          <h1 className="home-hero-title">Compete. Learn. Rank.</h1>
          <p className="home-hero-subtitle">
            High-fidelity mock exams for JEE-MAINS, JEE-ADV, NEET, and MHT-CET with
            exam-like pressure, fair monitoring, and real percentile comparison.
          </p>
          <div className="home-hero-actions">
            <Link to="/events" className="btn-primary home-hero-btn">
              Explore Live Tests <i className="fa-solid fa-arrow-right"></i>
            </Link>
            {secondaryHeroAction.disabled ? (
              <span className="btn-secondary home-hero-btn home-hero-btn-disabled">
                {secondaryHeroAction.label}
              </span>
            ) : (
              <Link to={secondaryHeroAction.to} className="btn-secondary home-hero-btn">
                {secondaryHeroAction.label}
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="home-section home-tracks">
        <div className="home-container">
          <div className="home-section-heading">
            <h2>Supported Exam Tracks</h2>
            <p>Built for the formats aspirants actually face.</p>
          </div>
          <div className="home-track-grid">
            {EXAM_TRACKS.map(track => (
              <article key={track.code} className="home-track-card">
                <div className="home-track-code">{track.code}</div>
                <div className="home-track-line">{track.line}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-flow">
        <div className="home-container">
          <div className="home-section-heading">
            <h2>How It Works</h2>
            <p>A clear loop from preparation to measurable outcomes.</p>
          </div>
          <div className="home-flow-grid">
            {WORKFLOW.map(item => (
              <article key={item.step} className="home-flow-card">
                <span className="home-flow-step">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-upcoming">
        <div className="home-container">
          <div className="home-upcoming-head">
            <div className="home-section-heading">
              <h2>Upcoming Tests</h2>
              <p>Register early and lock your slot.</p>
            </div>
            <Link to="/events" className="home-view-all">View all</Link>
          </div>

          {loading ? (
            <div className="loading" style={{ padding: '24px 0' }}>Loading upcoming tests...</div>
          ) : featuredEvents.length === 0 ? (
            <div className="empty-state home-empty-tight">
              <h3>No upcoming tests right now</h3>
              <p>We are scheduling new mocks. Check again soon.</p>
            </div>
          ) : (
            <div className="events-grid">
              {featuredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="home-cta">
        <div className="home-container">
          <h2>Ready to Level Up Your Preparation?</h2>
          <p>
            {ctaAction.disabled
              ? 'Finalizing your session and syncing your dashboard preferences.'
              : user
              ? 'Your next mock is waiting. Stay consistent and keep climbing.'
              : 'Join thousands of aspirants practicing under real exam pressure.'}
          </p>
          {ctaAction.disabled ? (
            <span className="btn-primary home-cta-btn home-cta-btn-disabled">
              {ctaAction.label}
            </span>
          ) : (
            <Link to={ctaAction.to} className="btn-primary home-cta-btn">
              {ctaAction.label}
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}
