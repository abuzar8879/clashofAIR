import React, { useState, useEffect } from 'react'
import { AdminLayout } from './AdminLayout.jsx'
import { eventsAPI, adminAPI } from '../../utils/api.js'
import { formatDateTime, EXAM_TYPES, getErrorMessage } from '../../utils/helpers.js'

const EMPTY_FORM = {
  title: '', exam_type: '', date: '', duration: '',
  question_count: '', is_visible: 1,
  subjects_config: [] // Array of { name, question_count, positive_marks, negative_marks }
}

export default function AdminEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadEvents() }, [])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getEvents()
      setEvents(res.data.events || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (event) => {
    let subjects = []
    try {
      subjects = event.subjects_config ? (typeof event.subjects_config === 'string' ? JSON.parse(event.subjects_config) : event.subjects_config) : []
    } catch (e) { console.error('Parse subjects error', e) }

    setEditEvent(event)
    setForm({
      title: event.title,
      exam_type: event.exam_type,
      date: event.date?.slice(0, 16), // datetime-local format
      duration: event.duration,
      question_count: event.question_count,
      is_visible: event.is_visible,
      subjects_config: subjects
    })
    setShowForm(true)
    setError('')
  }

  const handleCreate = () => {
    setEditEvent(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
    setError('')
  }

  const addSubject = () => {
    setForm(p => ({
      ...p,
      subjects_config: [...p.subjects_config, { name: '', question_count: '', positive_marks: 4, negative_marks: 1 }]
    }))
  }

  const removeSubject = (index) => {
    setForm(p => ({
      ...p,
      subjects_config: p.subjects_config.filter((_, i) => i !== index)
    }))
  }

  const updateSubject = (index, field, value) => {
    const newSubjects = [...form.subjects_config]
    newSubjects[index][field] = value
    setForm(p => ({ ...p, subjects_config: newSubjects }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.exam_type || !form.date || !form.duration || !form.question_count) {
      setError('All fields are required')
      return
    }

    // Validate subjects matching total question count
    if (form.subjects_config.length > 0) {
      const totalSubQ = form.subjects_config.reduce((sum, s) => sum + Number(s.question_count || 0), 0)
      if (totalSubQ !== Number(form.question_count)) {
        setError(`Sum of subject questions (${totalSubQ}) must equal total questions (${form.question_count})`)
        return
      }
    }

    setSaving(true)
    setError('')
    
    const payload = {
      ...form,
      subjects_config: JSON.stringify(form.subjects_config)
    }

    try {
      if (editEvent) {
        await eventsAPI.update(editEvent.id, payload)
        setSuccess('Test updated successfully')
      } else {
        await eventsAPI.create(payload)
        setSuccess('Test created successfully')
      }
      setShowForm(false)
      await loadEvents()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this test? This will also delete all questions, registrations, and submissions.')) return
    try {
      await eventsAPI.delete(id)
      await loadEvents()
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  return (
    <AdminLayout title="Tests Management">
      {success && <div className="alert alert-success">{success}</div>}
      {error && !showForm && <div className="alert alert-error">{error}</div>}

      <div style={{ marginBottom: '20px' }}>
        <button className="btn-primary" onClick={handleCreate}>+ Create Test</button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '600px' }}>
            <h2 className="modal-title">{editEvent ? 'Edit Test' : 'Create New Test'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Test Title *</label>
                <input type="text" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. JEE Main Mock Test - Series 1" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Exam Type *</label>
                  <select value={form.exam_type}
                    onChange={e => setForm(p => ({ ...p, exam_type: e.target.value }))} required>
                    <option value="">Select Type</option>
                    {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Visible to Students</label>
                  <select value={form.is_visible}
                    onChange={e => setForm(p => ({ ...p, is_visible: Number(e.target.value) }))}>
                    <option value={1}>Yes</option>
                    <option value={0}>No (Draft)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Start Date & Time *</label>
                <input type="datetime-local" value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Duration (minutes) *</label>
                  <input type="number" value={form.duration} min="10" max="360"
                    onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                    placeholder="e.g. 180" required />
                </div>
                <div className="form-group">
                  <label>Total Questions *</label>
                  <input type="number" value={form.question_count} min="1"
                    onChange={e => setForm(p => ({ ...p, question_count: e.target.value }))}
                    placeholder="e.g. 90" required />
                </div>
              </div>

              {/* Subjects Section */}
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px' }}>Subject Configuration</h3>
                  <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={addSubject}>
                    + Add Subject
                  </button>
                </div>
                
                {form.subjects_config.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No subjects added. Total score calculation will use default +1/0 marks.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {form.subjects_config.map((sub, idx) => (
                      <div key={idx} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', position: 'relative' }}>
                        <button type="button" onClick={() => removeSubject(idx)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '10px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '11px' }}>Name</label>
                            <input type="text" value={sub.name} onChange={e => updateSubject(idx, 'name', e.target.value)} placeholder="Physics" required />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '11px' }}>Questions</label>
                            <input type="number" value={sub.question_count} onChange={e => updateSubject(idx, 'question_count', e.target.value)} placeholder="30" required />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '11px' }}>+ Marks</label>
                            <input type="number" value={sub.positive_marks} onChange={e => updateSubject(idx, 'positive_marks', e.target.value)} required />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '11px' }}>- Marks</label>
                            <input type="number" value={sub.negative_marks} onChange={e => updateSubject(idx, 'negative_marks', e.target.value)} required />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" className="btn-secondary"
                  onClick={() => { setShowForm(false); setError('') }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editEvent ? 'Update Test' : 'Create Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tests Table */}
      {loading ? (
        <div className="loading">Loading tests...</div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <h3>No Tests Yet</h3>
          <p>Create your first mock exam test.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Questions</th>
                <th>Registrations</th>
                <th>Submissions</th>
                <th>Visible</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id}>
                  <td style={{ fontWeight: '500', maxWidth: '220px' }}>{event.title}</td>
                  <td>{event.exam_type}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {formatDateTime(event.date)}
                  </td>
                  <td>{event.duration}m</td>
                  <td>{event.question_count}</td>
                  <td>{event.registrations || 0}</td>
                  <td>{event.submissions || 0}</td>
                  <td>{event.is_visible ? <i className="fa-solid fa-check" style={{ color: 'var(--success)' }}></i> : <i className="fa-solid fa-xmark" style={{ color: 'var(--danger)' }}></i>}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: '12px', padding: '4px 10px' }}
                        onClick={() => handleEdit(event)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-danger"
                        style={{ fontSize: '12px', padding: '4px 10px' }}
                        onClick={() => handleDelete(event.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
