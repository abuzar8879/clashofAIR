import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        api.get('/me').then(res => {
          setUser(res.data)
          localStorage.setItem('user', JSON.stringify(res.data))
        }).catch(async () => {
          try {
            await api.post('/refresh')
            const me = await api.get('/me')
            setUser(me.data)
            localStorage.setItem('user', JSON.stringify(me.data))
          } catch {
          localStorage.removeItem('user')
          setUser(null)
          } finally {
            setLoading(false)
          }
        }).finally(() => setLoading(false))
      } catch (e) {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    api.post('/logout').catch(() => {})
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
