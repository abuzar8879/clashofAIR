import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Events from './pages/Events.jsx'
import EventDetail from './pages/EventDetail.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Profile from './pages/Profile.jsx'
import ProfileResults from './pages/ProfileResults.jsx'
import AboutUs from './pages/AboutUs.jsx'
import ExamInterface from './pages/ExamInterface.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminEvents from './pages/admin/AdminEvents.jsx'
import AdminQuestions from './pages/admin/AdminQuestions.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import AdminResults from './pages/admin/AdminResults.jsx'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
            {/* Exam interface - no navbar */}
            <Route path="/exam/:eventId" element={
              <ProtectedRoute>
                <ExamInterface />
              </ProtectedRoute>
            } />

            {/* Auth pages - with navbar */}
            <Route path="/login" element={<WithNavbar><Login /></WithNavbar>} />
            <Route path="/register" element={<WithNavbar><Register /></WithNavbar>} />

            {/* Admin pages - sidebar layout */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/events" element={
              <ProtectedRoute adminOnly>
                <AdminEvents />
              </ProtectedRoute>
            } />
            <Route path="/admin/questions" element={
              <ProtectedRoute adminOnly>
                <AdminQuestions />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute adminOnly>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/results" element={
              <ProtectedRoute adminOnly>
                <AdminResults />
              </ProtectedRoute>
            } />

            {/* Main pages - with navbar */}
            <Route path="/" element={<WithNavbar><Home /></WithNavbar>} />
            <Route path="/events" element={
              <WithNavbar>
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              </WithNavbar>
            } />
            <Route path="/events/:id" element={
              <WithNavbar>
                <ProtectedRoute>
                  <EventDetail />
                </ProtectedRoute>
              </WithNavbar>
            } />
            <Route path="/about" element={<WithNavbar><AboutUs /></WithNavbar>} />
            <Route path="/profile" element={
              <WithNavbar>
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </WithNavbar>
            } />
            <Route path="/profile/results" element={
              <WithNavbar>
                <ProtectedRoute>
                  <ProfileResults />
                </ProtectedRoute>
              </WithNavbar>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

function WithNavbar({ children }) {
  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        {children}
      </div>
      <Footer />
    </>
  )
}

export default App
