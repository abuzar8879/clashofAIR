import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const TRACKS = ['JEE-MAINS', 'JEE-ADV', 'NEET', 'MHT-CET']

export default function Footer() {
  const { user } = useAuth()
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer-top">
        <div className="site-footer-brand">
          <h3>clashofAIR</h3>
          <p>
            India-focused mock exam platform built for disciplined preparation,
            realistic pressure, and measurable outcomes.
          </p>
        </div>

        <div className="site-footer-col">
          <h4>Platform</h4>
          <Link to="/">Home</Link>
          <Link to="/events">Tests</Link>
          <Link to="/about">About</Link>
          <Link to={user ? '/profile' : '/login'}>{user ? 'Profile' : 'Login'}</Link>
        </div>

        <div className="site-footer-col">
          <h4>Exam Tracks</h4>
          {TRACKS.map(track => (
            <span key={track} className="site-footer-track">{track}</span>
          ))}
        </div>

        <div className="site-footer-col">
          <h4>Why Students Use It</h4>
          <p>Real exam-style interface</p>
          <p>Rank and percentile comparison</p>
          <p>Anti-cheat monitoring support</p>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>(c) {year} clashofAIR</span>
        <span>Built for aspirants across India</span>
      </div>
    </footer>
  )
}
