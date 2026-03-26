import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

const DEFAULT_DURATION = 4000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message, options = {}) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const toast = {
      id,
      message,
      type: options.type || 'info',
      duration: Number.isFinite(options.duration) ? options.duration : DEFAULT_DURATION,
    }
    setToasts(prev => [...prev, toast])

    if (toast.duration > 0) {
      setTimeout(() => removeToast(id), toast.duration)
    }

    return id
  }, [removeToast])

  const value = useMemo(() => ({
    showToast,
    showSuccess: (message, duration) => showToast(message, { type: 'success', duration }),
    showError: (message, duration) => showToast(message, { type: 'error', duration }),
    showWarning: (message, duration) => showToast(message, { type: 'warning', duration }),
  }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            role="status"
          >
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
