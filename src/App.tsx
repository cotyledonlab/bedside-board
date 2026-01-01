import { useState, useEffect, useCallback } from 'react'
import {
  loadDayData,
  saveDayData,
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
  const [toast, setToast] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState('')

  // Load data on mount
  useEffect(() => {
    setData(loadDayData())
  }, [])

  // Save data whenever it changes
  useEffect(() => {
    if (data) {
      saveDayData(data)
    }
  }, [data])

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])

  const updateData = useCallback((updates: Partial<DayData>) => {
    setData(prev => prev ? { ...prev, ...updates } : prev)
  }, [])

  const addEvent = useCallback((type: string) => {
    const event: EventEntry = {
      id: generateId(),
      time: formatTime(),
      type,
    }
    setData(prev => prev ? {
      ...prev,
      events: [event, ...prev.events]
    } : prev)
    showToast(`Logged: ${type}`)
  }, [showToast])

  const deleteEvent = useCallback((id: string) => {
    setData(prev => prev ? {
      ...prev,
      events: prev.events.filter(e => e.id !== id)
    } : prev)
  }, [])

  const addQuestion = useCallback(() => {
    if (!newQuestion.trim()) return

    const question: Question = {
      id: generateId(),
      text: newQuestion.trim(),
      answered: false,
    }
    setData(prev => prev ? {
      ...prev,
      questions: [...prev.questions, question]
    } : prev)
    setNewQuestion('')
  }, [newQuestion])

  const toggleQuestion = useCallback((id: string) => {
    setData(prev => prev ? {
      ...prev,
      questions: prev.questions.map(q =>
        q.id === id ? { ...q, answered: !q.answered } : q
      )
    } : prev)
  }, [])

  const deleteQuestion = useCallback((id: string) => {
    setData(prev => prev ? {
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    } : prev)
  }, [])

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

  if (!data) {
    return (
      <div className="container">
        <p>Loading...</p>
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
            onChange={(e) => updateData({ admissionDate: e.target.value || null })}
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
              onClick={() => updateData({ mood: index })}
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
            onChange={(e) => updateData({ pain: parseInt(e.target.value) })}
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
            onChange={(e) => updateData({ anxiety: parseInt(e.target.value) })}
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
            onChange={(e) => updateData({ energy: parseInt(e.target.value) })}
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
          onChange={(e) => updateData({ notes: e.target.value })}
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
