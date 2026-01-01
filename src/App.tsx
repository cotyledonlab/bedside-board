import { useState, useEffect, useCallback, useRef } from 'react'
import {
  loadDayData,
  updateDayData,
  addEvent as apiAddEvent,
  deleteEvent as apiDeleteEvent,
  addQuestion as apiAddQuestion,
  updateQuestionAnswered,
  deleteQuestion as apiDeleteQuestion,
  generateId,
  formatTime,
  generateSummary,
  calculateDayNumber,
  type DayData,
  type EventEntry,
  type Question,
} from './storage'

const MOODS = ['😫', '😔', '😐', '🙂', '😄']

const EVENT_TYPES = [
  { type: 'Obs done', icon: '🩺' },
  { type: 'Bloods', icon: '🩸' },
  { type: 'ECG', icon: '💓' },
  { type: 'Scan/X-ray', icon: '📷' },
  { type: 'Doctor round', icon: '👨‍⚕️' },
  { type: 'Medication', icon: '💊' },
  { type: 'Meal', icon: '🍽️' },
]

export default function App() {
  const [data, setData] = useState<DayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState('')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Load data on mount
  useEffect(() => {
    loadDayData().then(dayData => {
      setData(dayData)
      setLoading(false)
    })
  }, [])

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])

  // Debounced update for sliders and text inputs
  const debouncedUpdate = useCallback((updates: Partial<DayData>) => {
    if (!data) return

    // Update local state immediately for responsiveness
    setData(prev => prev ? { ...prev, ...updates } : prev)

    // Debounce API call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      updateDayData(data.date, updates).catch(err => {
        console.error('Failed to save:', err)
        showToast('Failed to save')
      })
    }, 500)
  }, [data, showToast])

  // Immediate update for mood (no debounce needed)
  const updateMood = useCallback(async (mood: number) => {
    if (!data) return
    setData(prev => prev ? { ...prev, mood } : prev)
    try {
      await updateDayData(data.date, { mood })
    } catch (err) {
      console.error('Failed to save mood:', err)
      showToast('Failed to save')
    }
  }, [data, showToast])

  const updateAdmission = useCallback(async (admissionDate: string | null) => {
    if (!data) return
    setData(prev => prev ? { ...prev, admissionDate } : prev)
    try {
      await updateDayData(data.date, { admissionDate })
    } catch (err) {
      console.error('Failed to save admission date:', err)
      showToast('Failed to save')
    }
  }, [data, showToast])

  const addEvent = useCallback(async (type: string) => {
    if (!data) return

    const event: EventEntry = {
      id: generateId(),
      time: formatTime(),
      type,
    }

    // Optimistic update
    setData(prev => prev ? {
      ...prev,
      events: [event, ...prev.events]
    } : prev)

    try {
      const updated = await apiAddEvent(data.date, event)
      setData(updated)
      showToast(`Logged: ${type}`)
    } catch (err) {
      console.error('Failed to add event:', err)
      // Revert on error
      setData(prev => prev ? {
        ...prev,
        events: prev.events.filter(e => e.id !== event.id)
      } : prev)
      showToast('Failed to log event')
    }
  }, [data, showToast])

  const deleteEvent = useCallback(async (id: string) => {
    if (!data) return

    const eventToDelete = data.events.find(e => e.id === id)

    // Optimistic update
    setData(prev => prev ? {
      ...prev,
      events: prev.events.filter(e => e.id !== id)
    } : prev)

    try {
      await apiDeleteEvent(id)
    } catch (err) {
      console.error('Failed to delete event:', err)
      // Revert on error
      if (eventToDelete) {
        setData(prev => prev ? {
          ...prev,
          events: [...prev.events, eventToDelete]
        } : prev)
      }
      showToast('Failed to delete event')
    }
  }, [data, showToast])

  const addQuestion = useCallback(async () => {
    if (!newQuestion.trim() || !data) return

    const question: Question = {
      id: generateId(),
      text: newQuestion.trim(),
      answered: false,
    }

    // Optimistic update
    setData(prev => prev ? {
      ...prev,
      questions: [...prev.questions, question]
    } : prev)
    setNewQuestion('')

    try {
      const updated = await apiAddQuestion(data.date, question)
      setData(updated)
    } catch (err) {
      console.error('Failed to add question:', err)
      // Revert on error
      setData(prev => prev ? {
        ...prev,
        questions: prev.questions.filter(q => q.id !== question.id)
      } : prev)
      showToast('Failed to add question')
    }
  }, [data, newQuestion, showToast])

  const toggleQuestion = useCallback(async (id: string) => {
    if (!data) return

    const question = data.questions.find(q => q.id === id)
    if (!question) return

    const newAnswered = !question.answered

    // Optimistic update
    setData(prev => prev ? {
      ...prev,
      questions: prev.questions.map(q =>
        q.id === id ? { ...q, answered: newAnswered } : q
      )
    } : prev)

    try {
      await updateQuestionAnswered(id, newAnswered)
    } catch (err) {
      console.error('Failed to update question:', err)
      // Revert on error
      setData(prev => prev ? {
        ...prev,
        questions: prev.questions.map(q =>
          q.id === id ? { ...q, answered: !newAnswered } : q
        )
      } : prev)
      showToast('Failed to update question')
    }
  }, [data, showToast])

  const deleteQuestion = useCallback(async (id: string) => {
    if (!data) return

    const questionToDelete = data.questions.find(q => q.id === id)

    // Optimistic update
    setData(prev => prev ? {
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    } : prev)

    try {
      await apiDeleteQuestion(id)
    } catch (err) {
      console.error('Failed to delete question:', err)
      // Revert on error
      if (questionToDelete) {
        setData(prev => prev ? {
          ...prev,
          questions: [...prev.questions, questionToDelete]
        } : prev)
      }
      showToast('Failed to delete question')
    }
  }, [data, showToast])

  const copySummary = useCallback(async () => {
    if (!data) return

    const summary = generateSummary(data)
    try {
      await navigator.clipboard.writeText(summary)
      showToast('Summary copied!')
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = summary
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showToast('Summary copied!')
    }
  }, [data, showToast])

  if (loading) {
    return (
      <div className="container">
        <p>Loading...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container">
        <p>Failed to load data</p>
      </div>
    )
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
  const dayNumber = calculateDayNumber(data.admissionDate)

  return (
    <div className="container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="date-display">
          <span className="date-main">{dateStr}</span>
          {dayNumber && (
            <span className="date-sub">Day {dayNumber} in hospital</span>
          )}
        </div>
        <button className="btn" onClick={copySummary}>
          📋 Copy summary
        </button>
      </div>

      {/* Admission Date */}
      <div className="section">
        <div className="admission-row">
          <label className="admission-label">Admitted:</label>
          <input
            type="date"
            className="admission-input"
            value={data.admissionDate || ''}
            onChange={(e) => updateAdmission(e.target.value || null)}
          />
        </div>
      </div>

      {/* Your Current State */}
      <div className="section">
        <h2 className="section-title">How are you feeling?</h2>

        {/* Mood Picker */}
        <div className="mood-picker">
          {MOODS.map((emoji, index) => (
            <button
              key={index}
              className={`mood-btn ${data.mood === index ? 'selected' : ''}`}
              onClick={() => updateMood(index)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="section">
        <h2 className="section-title">Your levels</h2>

        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-label">Pain</span>
            <span className="slider-value">{data.pain}</span>
          </div>
          <input
            type="range"
            className="slider"
            min="0"
            max="10"
            value={data.pain}
            onChange={(e) => debouncedUpdate({ pain: parseInt(e.target.value) })}
          />
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-label">Anxiety</span>
            <span className="slider-value">{data.anxiety}</span>
          </div>
          <input
            type="range"
            className="slider"
            min="0"
            max="10"
            value={data.anxiety}
            onChange={(e) => debouncedUpdate({ anxiety: parseInt(e.target.value) })}
          />
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-label">Energy</span>
            <span className="slider-value">{data.energy}</span>
          </div>
          <input
            type="range"
            className="slider"
            min="0"
            max="10"
            value={data.energy}
            onChange={(e) => debouncedUpdate({ energy: parseInt(e.target.value) })}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="section">
        <h2 className="section-title">What's going on?</h2>
        <textarea
          className="notes-input"
          placeholder="Any symptoms, thoughts, or things to remember..."
          value={data.notes}
          onChange={(e) => debouncedUpdate({ notes: e.target.value })}
        />
      </div>

      {/* Event Log */}
      <div className="section">
        <h2 className="section-title">Log an event</h2>

        <div className="event-buttons">
          {EVENT_TYPES.map(({ type, icon }) => (
            <button
              key={type}
              className="event-btn"
              onClick={() => addEvent(type)}
            >
              <span className="icon">{icon}</span>
              {type}
            </button>
          ))}
        </div>

        <div className="event-log">
          {data.events.length === 0 ? (
            <p className="no-events">No events logged yet today</p>
          ) : (
            data.events.map(event => (
              <div key={event.id} className="event-item">
                <span className="event-time">{event.time}</span>
                <span className="event-text">{event.type}</span>
                <button
                  className="event-delete"
                  onClick={() => deleteEvent(event.id)}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="section">
        <h2 className="section-title">Questions for the team</h2>

        <div className="question-input-row">
          <input
            type="text"
            className="question-input"
            placeholder="Add a question..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
          />
          <button className="btn" onClick={addQuestion}>
            Add
          </button>
        </div>

        <div className="questions-list">
          {data.questions.length === 0 ? (
            <p className="no-questions">No questions yet</p>
          ) : (
            data.questions.map(question => (
              <div key={question.id} className="question-item">
                <input
                  type="checkbox"
                  className="question-checkbox"
                  checked={question.answered}
                  onChange={() => toggleQuestion(question.id)}
                />
                <span className={`question-text ${question.answered ? 'answered' : ''}`}>
                  {question.text}
                </span>
                <button
                  className="question-delete"
                  onClick={() => deleteQuestion(question.id)}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
