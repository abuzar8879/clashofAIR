import React from 'react'

export default function AboutUs() {
  return (
    <div className="page-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="section-title">About clashofAIR</h1>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Our Mission</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          clashofAIR is India's most realistic computer-based mock exam platform designed specifically for students 
          preparing for JEE-MAINS, JEE-ADV, NEET, and MHT-CET.
        </p>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: '12px' }}>
          Our goal is to give every student access to a fair, pressure-filled, realistic exam simulation — 
          so you walk into your actual exam feeling confident and prepared.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Platform Features</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { icon: 'fa-bullseye', title: 'Real Exam Simulation', desc: 'Computer-Based Testing (CBT) interface identical to actual exam portals — same OMR panel, same timer, same pressure.' },
            { icon: 'fa-chart-simple', title: 'Percentile Rankings', desc: 'Accurate percentile scores calculated across all participants, just like in actual competitive exams.' },
            { icon: 'fa-lock', title: 'Anti-Cheat Protection', desc: 'Fullscreen enforcement, tab-switch detection, and violation tracking ensures a fair environment for all students.' },
            { icon: 'fa-map-location-dot', title: 'All-India Leaderboard', desc: 'Compete with students from every state in India. See where you stand with state-wise breakdowns.' },
            { icon: 'fa-bolt', title: 'Instant Results', desc: 'Get your score, percentile, and detailed analysis as soon as the exam period ends.' },
            { icon: 'fa-mobile-screen-button', title: 'Fast & Lightweight', desc: 'Built for speed — no heavy graphics, no animations. Just the exam, your questions, and your performance.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', gap: '14px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '20px', flexShrink: 0, width: '24px', textAlign: 'center' }}>
                <i className={`fa-solid ${icon}`}></i>
              </span>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Supported Examinations</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { name: 'JEE-MAINS', desc: 'Joint Entrance Examination Main for engineering admissions' },
            { name: 'JEE-ADV', desc: 'Joint Entrance Examination Advanced for IIT admissions' },
            { name: 'NEET', desc: 'National Eligibility cum Entrance Test for medical admissions' },
            { name: 'MHT-CET', desc: 'Maharashtra Common Entrance Test' },
            ].map(({ name, desc }) => (
            <div key={name} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '14px' }}>{name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Built With</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {['React + Vite', 'Cloudflare Workers', 'Cloudflare D1 (SQLite)', 'Cloudflare Pages', 'Hono.js', 'JWT Auth'].map(tech => (
            <span key={tech} style={{
              padding: '4px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: '500',
            }}>
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
