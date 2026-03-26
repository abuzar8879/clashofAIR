import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { questionsAPI, examAPI, eventsAPI } from '../utils/api.js'
import { useExam } from '../hooks/useExam.js'
import { useAntiCheat } from '../hooks/useAntiCheat.js'
import QuestionArea from '../components/QuestionArea.jsx'
import OMRPanel from '../components/OMRPanel.jsx'
import Timer from '../components/Timer.jsx'
import { useToast } from '../context/ToastContext.jsx'

export default function ExamInterface() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [isStarted, setIsStarted] = useState(false)
  const { showError } = useToast()

  const handleAutoSubmit = useCallback(async (currentAnswers) => {
    await submitExam(currentAnswers || {})
  }, [])

  const {
    answers, currentIndex, markedForReview, timeRemaining,
    isSubmitting, setIsSubmitting,
    selectAnswer, clearAnswer, toggleMarkForReview,
    goToQuestion, goNext, goPrev,
    getQuestionState, getStats, getTimeTaken,
    clearSavedState, currentQuestion,
  } = useExam(eventId, questions, event?.duration, handleAutoSubmit, isStarted)

  const {
    showWarning, warningMessage, violationCount, dismissWarning, requestFullscreen,
  } = useAntiCheat(
    Number(eventId),
    useCallback(() => submitExam(answers), [answers]),
    isStarted
  )

  useEffect(() => {
    loadExam()
  }, [eventId])

  const loadExam = async () => {
    try {
      const [eventRes, questionsRes] = await Promise.all([
        eventsAPI.getById(eventId),
        questionsAPI.getForExam(eventId),
      ])
      setEvent(eventRes.data)
      setQuestions(questionsRes.data.questions || [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load exam. Please check your registration.')
    } finally {
      setLoading(false)
    }
  }

  const handleStartExam = () => {
    requestFullscreen()
    setIsStarted(true)
  }

  const buildSubmissionAnswers = useCallback((inputAnswers = {}) => {
    const normalized = {}

    for (const [questionId, selected] of Object.entries(inputAnswers)) {
      if (selected === null || selected === undefined) continue

      const selectedValue = String(selected).trim()
      if (!selectedValue) continue

      // Backward compatibility: convert legacy key answers (A/B/C/D) to option text
      if (/^[A-D]$/i.test(selectedValue)) {
        const question = questions.find(q => String(q.id) === String(questionId))
        if (question) {
          const optionText = question[`option_${selectedValue.toLowerCase()}`]
          normalized[questionId] = optionText ? String(optionText) : selectedValue.toUpperCase()
        } else {
          normalized[questionId] = selectedValue.toUpperCase()
        }
      } else {
        normalized[questionId] = selectedValue
      }
    }

    return normalized
  }, [questions])

  const submitExam = async (currentAnswers) => {
    if (isSubmitting || submitted) return
    setIsSubmitting(true)
    setShowSubmitConfirm(false)
    try {
      const timeTaken = getTimeTaken()
      const submissionAnswers = buildSubmissionAnswers(currentAnswers || answers)
      const res = await examAPI.submit({
        event_id: Number(eventId),
        answers: submissionAnswers,
        time_taken: timeTaken,
      })
      clearSavedState()
      setSubmitResult(res.data.result)
      setSubmitted(true)

      // Exit fullscreen
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {})
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to submit exam'
      if (msg.includes('already submitted')) {
        clearSavedState()
        setSubmitted(true)
        navigate(`/events/${eventId}`)
      } else {
        showError(msg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading">Loading exam...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>
          <button className="btn-secondary" onClick={() => navigate(`/events/${eventId}`)}>
            <i className="fa-solid fa-arrow-left"></i> Back to Event
          </button>
        </div>
      </div>
    )
  }

  // Instructions / Start Screen
  if (!isStarted && !submitted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>Exam Instructions</h1>
          
          <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '12px' }}><strong>Please read carefully before starting:</strong></p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Total Duration: <strong>{event?.duration} minutes</strong></li>
              <li>Question Count: <strong>{questions.length} questions</strong></li>
              <li>The exam will automatically enter <strong>Fullscreen Mode</strong>.</li>
              <li><strong>Anti-Cheat Enabled:</strong> Exiting fullscreen or switching tabs will trigger a violation.</li>
              <li>3 violations will result in <strong>Automatic Submission</strong> of your exam.</li>
              <li>Do not refresh the page or use back/forward buttons during the exam.</li>
            </ul>
          </div>

          <button className="btn-primary" onClick={handleStartExam} style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: '600' }}>
            I am Ready — Start Exam
          </button>
          <button className="btn-secondary" onClick={() => navigate(`/events/${eventId}`)} style={{ width: '100%', marginTop: '12px' }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Submitted result screen
  if (submitted && submitResult) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', width: '100%' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--success)' }}>
            <i className="fa-solid fa-medal"></i>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>Exam Submitted!</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Score', value: `${submitResult.score} / ${submitResult.totalQuestions}` },
              { label: 'Correct', value: submitResult.correctCount, color: 'var(--answered)' },
              { label: 'Incorrect', value: submitResult.incorrectCount, color: 'var(--danger)' },
              { label: 'Rank', value: `#${submitResult.rank}` },
              { label: 'Percentile', value: submitResult.percentile, color: 'var(--current)' },
              { label: 'Time Taken', value: `${Math.floor(submitResult.timeTaken / 60)}m ${submitResult.timeTaken % 60}s` },
            ].map(({ label, value, color }) => (
              <div key={label} className="card" style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: '22px', fontWeight: '700', color: color || 'var(--text)' }}>{value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</div>
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={() => navigate(`/events/${eventId}`)} style={{ width: '100%' }}>
            View Full Result & Leaderboard <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    )
  }

  // Calculate subject-relative index
  const subjectQuestions = questions.filter(q => (q.subject || 'General') === (currentQuestion?.subject || 'General'))
  const subjectIndex = subjectQuestions.findIndex(q => q.id === currentQuestion?.id)
  const subjectTotal = subjectQuestions.length

  return (
    <div className="exam-wrapper">
      {/* Anti-cheat warning modal */}
      {showWarning && (
        <div className="warning-modal">
          <div className="warning-box">
            <div className="warning-icon">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2>Anti-Cheat Warning</h2>
            <p>{warningMessage}</p>
            {violationCount < 3 && (
              <button className="btn-primary" onClick={dismissWarning} style={{ width: '100%' }}>
                I Understand — Return to Exam
              </button>
            )}
          </div>
        </div>
      )}

      {/* Submit confirmation modal */}
      {showSubmitConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="modal-title">Submit Exam?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
              Are you sure you want to submit? This action cannot be undone.
            </p>
            <div style={{ fontSize: '14px', marginBottom: '16px' }}>
              <div><i className="fa-solid fa-check" style={{ color: 'var(--answered)' }}></i> Answered: {getStats().answered}</div>
              <div style={{ color: 'var(--text-secondary)' }}><i className="fa-regular fa-square"></i> Unanswered: {getStats().unanswered}</div>
              <div style={{ color: 'var(--marked)' }}><i className="fa-solid fa-bookmark"></i> Marked for Review: {getStats().marked}</div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowSubmitConfirm(false)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => submitExam(answers)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="exam-topbar">
        <div className="exam-topbar-title">{event?.title}</div>
        <Timer timeRemaining={timeRemaining} />
        <button
          className="btn-danger"
          onClick={() => setShowSubmitConfirm(true)}
          disabled={isSubmitting}
          style={{ padding: '6px 16px', fontSize: '13px' }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Exam'}
        </button>
      </div>

      {/* Subject Tabs */}
      {isStarted && !submitted && (
        <div className="subject-tabs">
          {Object.entries(
            questions?.reduce((acc, q, i) => {
              const s = q.subject || 'General'
              if (!(s in acc)) acc[s] = i
              return acc
            }, {}) || {}
          ).map(([s, firstIdx]) => (
            <button
              key={s}
              className={`subject-tab ${currentQuestion?.subject === s || (!currentQuestion?.subject && s === 'General') ? 'active' : ''}`}
              onClick={() => goToQuestion(firstIdx)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Exam body */}
      <div className="exam-body">
        <QuestionArea
          question={currentQuestion}
          questionIndex={subjectIndex}
          totalQuestions={subjectTotal}
          selectedAnswer={answers[currentQuestion?.id]}
          isMarked={currentQuestion && markedForReview.has(currentQuestion.id)}
          onSelect={selectAnswer}
          onNext={goNext}
          onPrev={goPrev}
          onMarkReview={toggleMarkForReview}
          onClearResponse={clearAnswer}
          isFirst={currentIndex === 0}
          isLast={currentIndex === (questions?.length || 0) - 1}
        />

        <OMRPanel
          questions={questions}
          answers={answers}
          markedForReview={markedForReview}
          currentIndex={currentIndex}
          onQuestionClick={goToQuestion}
          onSubmit={() => setShowSubmitConfirm(true)}
        />
      </div>
    </div>
  )
}
