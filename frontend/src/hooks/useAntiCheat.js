import { useState, useEffect, useRef, useCallback } from 'react'
import { examAPI } from '../utils/api.js'

export function useAntiCheat(eventId, onAutoSubmit, isActive = false) {
  const [violationCount, setViolationCount] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const violationRef = useRef(0)
  const isInitializedRef = useRef(false)

  const logViolation = useCallback(async (type) => {
    try {
      if (eventId) {
        await examAPI.logViolation({ event_id: eventId, violation_type: type })
      }
    } catch (e) {
      console.error('Failed to log violation:', e)
    }
  }, [eventId])

  const handleViolation = useCallback((type) => {
    violationRef.current += 1
    const count = violationRef.current
    setViolationCount(count)
    logViolation(type)

    if (count === 1) {
      setWarningMessage('Warning (1/3): You exited fullscreen or switched tabs. This is being recorded. Please return to the exam immediately.')
      setShowWarning(true)
    } else if (count === 2) {
      setWarningMessage('Final Warning (2/3): Another violation detected! One more violation will result in automatic exam submission.')
      setShowWarning(true)
    } else if (count >= 3) {
      setWarningMessage('Exam Auto-Submitted: You exceeded the maximum number of violations. Your current answers have been submitted.')
      setShowWarning(true)
      setTimeout(() => {
        onAutoSubmit && onAutoSubmit()
      }, 2000)
    }
  }, [logViolation, onAutoSubmit])

  const requestFullscreen = useCallback(() => {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch((e) => {
        console.warn('Fullscreen request denied', e)
      })
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen()
      setIsFullscreen(true)
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen()
      setIsFullscreen(true)
    }
  }, [])

  const dismissWarning = useCallback(() => {
    if (violationRef.current < 3) {
      setShowWarning(false)
      requestFullscreen()
    }
  }, [requestFullscreen])

  useEffect(() => {
    if (!isActive) return
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    // Fullscreen change detection
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      )
      setIsFullscreen(isFullscreenNow)
      // Only trigger violation if we were supposed to be fullscreen
      if (!isFullscreenNow && isInitializedRef.current && isActive) {
        handleViolation('fullscreen_exit')
      }
    }

    // Tab/window visibility change
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        handleViolation('tab_switch')
      }
    }

    // Prevent right-click
    const handleContextMenu = (e) => {
      e.preventDefault()
    }

    // Prevent keyboard shortcuts
    const handleKeyDown = (e) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, Ctrl+Shift+C
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.key === 'p') ||
        (e.metaKey && e.key === 'F12')
      ) {
        e.preventDefault()
      }
    }

    // Prevent text selection during exam
    const handleSelectStart = (e) => {
      e.preventDefault()
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('selectstart', handleSelectStart)

    return () => {
      isInitializedRef.current = false
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('selectstart', handleSelectStart)
    }
  }, [handleViolation, isActive])

  return {
    violationCount,
    showWarning,
    warningMessage,
    isFullscreen,
    dismissWarning,
    requestFullscreen,
  }
}
