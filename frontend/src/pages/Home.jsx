import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { eventsAPI } from '../utils/api.js'
import EventCard from '../components/EventCard.jsx'
import { formatDateTime } from '../utils/helpers.js'

export default function Home() {
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    eventsAPI.getAll({ limit: 3 })
      .then(res => setUpcomingEvents(res.data.events?.slice(0, 3) || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        padding: '80px 20px 60px',
        textAlign: 'center',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '44px',
            fontWeight: '800',
            letterSpacing: '-1px',
            marginBottom: '16px',
            color: 'var(--text)',
          }}>
            Compete. Learn. Rank.
          </h1>
          <p style={{
            fontSize: '17px',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '32px',
          }}>
            India's most realistic mock exam platform for JEE, NEET, MHT-CET, CAT & NEET-PG.
            Experience the actual exam pressure, compete with thousands of aspirants, and track your percentile.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/events">
              <button className="btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
                Join Test <i className="fa-solid fa-arrow-right" style={{ fontSize: '12px', marginLeft: '4px' }}></i>
              </button>
            </Link>
            <Link to="/register">
              <button className="btn-secondary" style={{ padding: '12px 28px', fontSize: '15px' }}>
                Register Free
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Exam Categories */}
      <section style={{ padding: '60px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', textAlign: 'center', marginBottom: '32px' }}>
            Supported Exams
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
          }}>
            {[
              { name: 'JEE Main', sub: 'Engineering' },
              { name: 'NEET-UG', sub: 'Medical' },
              { name: 'MHT-CET', sub: 'Maharashtra' },
              { name: 'CAT', sub: 'Management' },
              { name: 'NEET-PG', sub: 'PG Medical' },
            ].map(({ name, sub }) => (
              <div key={name} className="card" style={{ textAlign: 'center', padding: '20px 12px' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>{name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '60px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', textAlign: 'center', marginBottom: '40px' }}>
            How It Works
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
          }}>
            {[
              { step: '01', title: 'Register & Sign Up', desc: 'Create your account with your exam category — JEE, NEET, CAT, MHT-CET or NEET-PG.' },
              { step: '02', title: 'Attempt Mock Exam', desc: 'Join scheduled mock tests in a realistic computer-based testing environment with timer and OMR.' },
              { step: '03', title: 'Get Your Percentile', desc: 'See your score, percentile ranking, and position on the test leaderboard instantly after submission.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'var(--btn-bg)', color: 'var(--btn-text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '700', fontSize: '16px', margin: '0 auto 16px',
                }}>
                  {step}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '60px 20px',
        background: 'var(--btn-bg)',
        textAlign: 'center',
      }}>
        <h2 style={{ color: 'var(--btn-text)', fontSize: '26px', fontWeight: '700', marginBottom: '12px' }}>
          Ready to Test Your Preparation?
        </h2>
        <p style={{ color: 'var(--btn-text)', opacity: 0.8, marginBottom: '24px', fontSize: '15px' }}>
          Join thousands of students competing on clashofAIR.
        </p>
        <Link to="/register">
          <button style={{
            padding: '12px 32px', fontSize: '15px', fontWeight: '600',
            background: 'var(--btn-text)', color: 'var(--btn-bg)',
            border: 'none', borderRadius: '4px', cursor: 'pointer',
          }}>
            Get Started Free
          </button>
        </Link>
      </section>

    </div>
  )
}
