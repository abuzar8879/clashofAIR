import React, { useState, useEffect, useMemo } from 'react'
import { AdminLayout } from './AdminLayout.jsx'
import { questionsAPI, adminAPI } from '../../utils/api.js'
import { parseCSV, getErrorMessage } from '../../utils/helpers.js'
import ConfirmModal from '../../components/ConfirmModal.jsx'
import { useToast } from '../../context/ToastContext.jsx'

const EMPTY_FORM = {
  event_id: '', subject: '', question_text: '', option_a: '', option_b: '',
  option_c: '', option_d: '', correct_answer: '', explanation: '',
}

export default function AdminQuestions() {
  const { showError, showSuccess, showWarning } = useToast()
  const [events, setEvents] = useState([])
  const [questions, setQuestions] = useState([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editQ, setEditQ] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [csvImporting, setCsvImporting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    adminAPI.getEvents()
      .then(res => setEvents(res.data.events || []))
      .catch(err => showError(getErrorMessage(err)))
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      loadQuestions(selectedEvent)
      setSelectedSubject('') // Reset subject filter when event changes
    }
    else setQuestions([])
  }, [selectedEvent])

  const loadQuestions = async (eventId) => {
    setLoading(true)
    try {
      const res = await questionsAPI.getAdmin(eventId)
      setQuestions(res.data.questions || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Get subjects for the selected test
  const currentEventSubjects = useMemo(() => {
    if (!selectedEvent) return []
    const ev = events.find(e => e.id.toString() === selectedEvent.toString())
    if (!ev || !ev.subjects_config) return []
    try {
      const config = typeof ev.subjects_config === 'string' ? JSON.parse(ev.subjects_config) : ev.subjects_config
      if (Array.isArray(config)) return config.map(s => s.name).filter(Boolean)
      if (config && typeof config === 'object') return Object.keys(config)
      return []
    } catch (e) { return [] }
  }, [selectedEvent, events])

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    if (!selectedSubject) return questions
    return questions.filter(q => q.subject === selectedSubject)
  }, [questions, selectedSubject])

  const handleEdit = (q) => {
    setEditQ(q)
    setForm({
      event_id: q.event_id,
      subject: q.subject || '',
      question_text: q.question_text,
      option_a: q.option_a, option_b: q.option_b,
      option_c: q.option_c, option_d: q.option_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
    })
    setShowForm(true)
    setError('')
  }

  const handleCreate = () => {
    setEditQ(null)
    setForm({ ...EMPTY_FORM, event_id: selectedEvent, subject: currentEventSubjects[0] || '' })
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.event_id || !form.question_text || !form.option_a || !form.option_b ||
        !form.option_c || !form.option_d || !form.correct_answer) {
      setError('All fields except explanation are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editQ) {
        await questionsAPI.update(editQ.id, form)
        setSuccess('Question updated')
      } else {
        await questionsAPI.create(form)
        setSuccess('Question created')
      }
      setShowForm(false)
      if (selectedEvent) loadQuestions(selectedEvent)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    try {
      await questionsAPI.delete(id)
      setQuestions(prev => prev.filter(q => q.id !== id))
      showSuccess('Question deleted')
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedEvent) {
      showWarning('Please select a test first, then upload CSV')
      return
    }
    
    // Check if a subject is selected if subjects exist for this test
    if (currentEventSubjects.length > 0 && !selectedSubject) {
      showWarning('Please select a subject from the dropdown before importing questions for that subject.')
      return
    }

    const text = await file.text()
    const parsed = parseCSV(text)
    if (!parsed.length) {
      showWarning('No valid questions found in CSV. Required columns: question_text, option_a, option_b, option_c, option_d, correct_answer')
      return
    }

    // Auto-assign the selected subject to all questions in this import
    const questionsToImport = parsed.map(q => ({
      ...q,
      subject: selectedSubject || 'General'
    }))

    setCsvImporting(true)
    try {
      const res = await questionsAPI.bulkImport({ 
        event_id: Number(selectedEvent), 
        questions: questionsToImport 
      })
      setSuccess(`Imported ${res.data.inserted} questions to "${selectedSubject || 'General'}" successfully${res.data.errors?.length > 0 ? ` (${res.data.errors.length} errors)` : ''}`)
      loadQuestions(selectedEvent)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setCsvImporting(false)
      e.target.value = ''
    }
  }

  const setF = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }))

  return (
    <AdminLayout title="Questions Management">
      {success && <div className="alert alert-success">{success}</div>}
      {error && !showForm && <div className="alert alert-error">{error}</div>}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Question?"
        message="This action will permanently remove the selected question."
        confirmText="Delete Question"
        cancelText="Cancel"
        danger
        onConfirm={() => {
          const id = deleteTarget
          setDeleteTarget(null)
          handleDelete(id)
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Filter row */}
      <div className="filter-row">
        <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
          style={{ maxWidth: '300px', flex: 'none' }}>
          <option value="">-- Select Test --</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title} ({ev.exam_type})</option>
          ))}
        </select>

        {selectedEvent && currentEventSubjects.length > 0 && (
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
            style={{ maxWidth: '200px', flex: 'none' }}>
            <option value="">All Subjects</option>
            {currentEventSubjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        {selectedEvent && (
          <>
            <button className="btn-primary" onClick={handleCreate}>+ Add Question</button>
            <label style={{
              padding: '9px 14px',
              background: 'var(--btn-secondary-bg)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              color: 'var(--text)',
            }}>
              {csvImporting ? 'Importing...' : <><i className="fa-solid fa-upload"></i> Import CSV</>}
              <input type="file" accept=".csv" onChange={handleCSVUpload}
                style={{ display: 'none' }} disabled={csvImporting} />
            </label>
          </>
        )}
      </div>

      {/* CSV format hint */}
      {selectedEvent && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '10px 14px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          marginBottom: '16px',
        }}>
          CSV Format: <code>question_text, option_a, option_b, option_c, option_d, correct_answer, explanation</code>
          <br />All questions will be assigned to the selected subject: <strong>{selectedSubject || 'General'}</strong>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '560px' }}>
            <h2 className="modal-title">{editQ ? 'Edit Question' : 'Add Question'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Test *</label>
                  <select value={form.event_id} onChange={setF('event_id')} required>
                    <option value="">Select Test</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject *</label>
                  <select value={form.subject} onChange={setF('subject')} required>
                    <option value="">Select Subject</option>
                    {currentEventSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    {currentEventSubjects.length === 0 && <option value="General">General</option>}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Question Text *</label>
                <textarea rows={3} value={form.question_text} onChange={setF('question_text')}
                  placeholder="Enter the question" required
                  style={{ resize: 'vertical', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--input-border)', borderRadius: '4px', padding: '8px 12px', width: '100%', fontFamily: 'inherit', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {['option_a', 'option_b', 'option_c', 'option_d'].map(key => (
                  <div className="form-group" key={key} style={{ marginBottom: '0' }}>
                    <label>Option {key.slice(-1).toUpperCase()} *</label>
                    <input value={form[key]} onChange={setF(key)} placeholder={`Option ${key.slice(-1).toUpperCase()}`} required />
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginTop: '12px' }}>
                <div className="form-group">
                  <label>Correct Answer *</label>
                  <select value={form.correct_answer} onChange={setF('correct_answer')} required>
                    <option value="">Select</option>
                    {['A', 'B', 'C', 'D'].map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Explanation (optional)</label>
                  <input value={form.explanation} onChange={setF('explanation')} placeholder="Why is this the correct answer?" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setError('') }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editQ ? 'Update' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions list */}
      {!selectedEvent ? (
        <div className="empty-state">
          <h3>Select a Test</h3>
          <p>Choose a test above to view and manage its questions.</p>
        </div>
      ) : loading ? (
        <div className="loading">Loading questions...</div>
      ) : filteredQuestions.length === 0 ? (
        <div className="empty-state">
          <h3>No Questions Found</h3>
          <p>{selectedSubject ? `No questions added for subject "${selectedSubject}".` : 'Add questions manually or import via CSV.'}</p>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {filteredQuestions.length} questions {selectedSubject && `in ${selectedSubject}`}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredQuestions.map((q, i) => (
              <div key={q.id} className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'var(--badge-bg)', color: 'var(--badge-text)', fontWeight: '600' }}>
                        {q.subject || 'No Subject'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Q{i + 1}.</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{q.question_text}</span>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', fontSize: '13px' }}>
                      {['A', 'B', 'C', 'D'].map(k => (
                        <span key={k} style={{
                          padding: '2px 8px',
                          borderRadius: '3px',
                          background: q.correct_answer === k ? 'var(--answered-bg)' : 'var(--bg-secondary)',
                          color: q.correct_answer === k ? 'var(--answered)' : 'var(--text-secondary)',
                          border: `1px solid ${q.correct_answer === k ? 'var(--answered)' : 'var(--border)'}`,
                          fontWeight: q.correct_answer === k ? '700' : '400',
                        }}>
                          {k}: {q[`option_${k.toLowerCase()}`]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button className="btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => handleEdit(q)}>Edit</button>
                    <button className="btn-danger" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => setDeleteTarget(q.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
