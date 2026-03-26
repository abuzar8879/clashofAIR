import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = (eventId) => `exam_state_${eventId}`

const getDurationSeconds = (durationMinutes) => {
  const mins = Number(durationMinutes)
  if (!Number.isFinite(mins) || mins <= 0) return 0
  return Math.floor(mins * 60)
}

export function useExam(eventId, questions, totalDurationMinutes, onAutoSubmit, isStarted = true) {
  const [answers, setAnswers] = useState({}) // { questionId: selectedOption }
  const [currentIndex, setCurrentIndex] = useState(0)
  const [markedForReview, setMarkedForReview] = useState(new Set())
  const [timeRemaining, setTimeRemaining] = useState(getDurationSeconds(totalDurationMinutes))
  const [startTime, setStartTime] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const timerRef = useRef(null)
  const autoSaveRef = useRef(null)

  // Load saved state from localStorage
  useEffect(() => {
    if (!eventId) return

    setAnswers({})
    setCurrentIndex(0)
    setMarkedForReview(new Set())
    setStartTime(null)

    const saved = localStorage.getItem(STORAGE_KEY(eventId))
    if (saved) {
      try {
        const state = JSON.parse(saved)
        if (state.answers) setAnswers(state.answers)
        if (state.markedForReview) setMarkedForReview(new Set(state.markedForReview))
        if (state.timeRemaining && state.timeRemaining > 0) {
          setTimeRemaining(state.timeRemaining)
        } else {
          setTimeRemaining(0)
        }
        if (state.currentIndex !== undefined) setCurrentIndex(state.currentIndex)
      } catch (e) {
        console.error('Failed to restore exam state:', e)
        setTimeRemaining(0)
      }
    } else {
      setTimeRemaining(0)
    }
  }, [eventId])

  // Initialize/clamp timer when event duration loads
  useEffect(() => {
    if (!eventId) return
    const durationSeconds = getDurationSeconds(totalDurationMinutes)
    if (!durationSeconds) return

    setTimeRemaining(prev => {
      if (!prev || prev <= 0) return durationSeconds
      return Math.min(prev, durationSeconds)
    })
  }, [eventId, totalDurationMinutes])

  // Timer countdown
  useEffect(() => {
    if (!questions?.length || !isStarted) return
    
    if (!startTime) setStartTime(Date.now())

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [questions, isStarted, startTime])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!isStarted) return
    autoSaveRef.current = setInterval(() => {
      saveState()
    }, 30000)

    return () => clearInterval(autoSaveRef.current)
  }, [answers, markedForReview, timeRemaining, currentIndex, isStarted])

  // Save on page hide
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      saveState()
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [answers, markedForReview, timeRemaining, currentIndex])

  const saveState = useCallback(() => {
    if (!eventId) return
    const state = {
      answers,
      markedForReview: Array.from(markedForReview),
      timeRemaining,
      currentIndex,
      savedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY(eventId), JSON.stringify(state))
  }, [eventId, answers, markedForReview, timeRemaining, currentIndex])

  const clearSavedState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY(eventId))
  }, [eventId])

  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    saveState()
    if (onAutoSubmit) {
      await onAutoSubmit(answers)
    }
    setIsSubmitting(false)
  }, [answers, isSubmitting, onAutoSubmit, saveState])

  const selectAnswer = useCallback((questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }, [])

  const clearAnswer = useCallback((questionId) => {
    setAnswers(prev => {
      const next = { ...prev }
      delete next[questionId]
      return next
    })
  }, [])

  const toggleMarkForReview = useCallback((questionId) => {
    setMarkedForReview(prev => {
      const next = new Set(prev)
      if (next.has(questionId)) {
        next.delete(questionId)
      } else {
        next.add(questionId)
      }
      return next
    })
  }, [])

  const goToQuestion = useCallback((index) => {
    if (index >= 0 && index < questions?.length) {
      setCurrentIndex(index)
    }
  }, [questions])

  const goNext = useCallback(() => {
    if (currentIndex < (questions?.length || 0) - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentIndex, questions])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  const getQuestionState = useCallback((questionId, index) => {
    if (index === currentIndex) return 'current'
    if (markedForReview.has(questionId)) return 'marked'
    if (answers[questionId]) return 'answered'
    return 'unanswered'
  }, [currentIndex, markedForReview, answers])

  const getStats = useCallback(() => {
    const total = questions?.length || 0
    const answered = Object.keys(answers).length
    const marked = markedForReview.size
    const unanswered = total - answered
    return { total, answered, marked, unanswered }
  }, [questions, answers, markedForReview])

  const getTimeTaken = useCallback(() => {
    if (!startTime) return 0
    return Math.floor((Date.now() - startTime) / 1000)
  }, [startTime])

  return {
    answers,
    currentIndex,
    markedForReview,
    timeRemaining,
    isSubmitting,
    setIsSubmitting,
    selectAnswer,
    clearAnswer,
    toggleMarkForReview,
    goToQuestion,
    goNext,
    goPrev,
    getQuestionState,
    getStats,
    getTimeTaken,
    saveState,
    clearSavedState,
    currentQuestion: questions?.[currentIndex],
  }
}
