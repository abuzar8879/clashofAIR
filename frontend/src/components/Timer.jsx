import React from 'react'
import { formatTime } from '../utils/helpers.js'

export default function Timer({ timeRemaining }) {
  const isWarning = timeRemaining <= 600 && timeRemaining > 120 // last 10 min
  const isDanger = timeRemaining <= 120 // last 2 min

  const className = `exam-timer ${isDanger ? 'danger' : isWarning ? 'warning' : ''}`

  return (
    <div className={className}>
      <span><i className="fa-solid fa-stopwatch"></i></span>
      <span>{formatTime(timeRemaining)}</span>
    </div>
  )
}
