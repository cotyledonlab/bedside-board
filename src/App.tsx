import { useState, useEffect, useCallback, useRef } from 'react'
import Settings from './Settings'
import {
  loadSettings,
  loadDayData,
  updateDayData,
  addEvent as apiAddEvent,
  deleteEvent as apiDeleteEvent,
  addQuestion as apiAddQuestion,
  updateQuestionAnswered,
  deleteQuestion as apiDeleteQuestion,
  generateId,
  formatTime,
  formatDate,
  getDateKey,
  generateSummary,
  calculateDayNumber,
  type DayData,
  type UserSettings,
  type EventEntry,
  type Question,
} from './storage'

const MOODS = ['😫', '😔', '😐', '🙂', '😄']

export default function App() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [data, setData] = useState<DayData | null>(null)
  const [currentDate, setCurrentDate] = useState(getDateKey())
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const isToday = currentDate === getDateKey()

  // Load settings and initial day data
  useEffect(() => {
    async function init() {
      try {
        const [settingsData, dayData] = await Promise.all([
          loadSettings(),
          loadDayData(currentDate),
        ])
        setSettings(settingsData)
        setData(dayData)
      } catch (err) {
        console.error('Failed to load:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Load day data when date changes
  useEffect(() => {
    if (!settings) return
    loadDayData(currentDate).then(setData).catch(console.error)
  }, [currentDate, settings])

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])

  const navigateDate = (days: number) => {
    const date = new Date(currentDate)
    date.setDate(date.getDate() + days)
    setCurrentDate(getDateKey(date))
  }

  const goToToday = () => {
    setCurrentDate(getDateKey())
  }

  // Debounced update for sliders and text inputs
  const debouncedUpdate = useCallback(
    (updates: { metricValues?: Record<string, number>; notes?: string }) => {
      if (!data) return

      setData(prev => (prev ? { ...prev, ...updates } : prev))

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        updateDayData(currentDate, updates).catch(err => {
          console.error('Failed to save:', err)
          showToast('Failed to save')
        })
      }, 500)
    },
    [currentDate, data, showToast]
  )

  const updateMood = useCallback(
    async (mood: number) => {
      if (!data) return
      setData(prev => (prev ? { ...prev, mood } : prev))
      try {
        await updateDayData(currentDate, { mood })
      } catch (err) {
        console.error('Failed to save mood:', err)
        showToast('Failed to save')
      }
    },
    [currentDate, data, showToast]
  )

  const updateAdmission = useCallback(
    async (admissionDate: string | null) => {
      if (!settings) return
      setSettings(prev => (prev ? { ...prev, admissionDate } : prev))
      try {
        await updateDayData(currentDate, { admissionDate })
      } catch (err) {
        console.error('Failed to save admission date:', err)
        showToast('Failed to save')
      }
    },
    [currentDate, settings, showToast]
  )

  const updateMetricValue = useCallback(
    (metricId: string, value: number) => {
      if (!data) return
      const newMetricValues = { ...data.metricValues, [metricId]: value }
      debouncedUpdate({ metricValues: newMetricValues })
    },
    [data, debouncedUpdate]
  )

  const addEvent = useCallback(
    async (type: string) => {
      if (!data) return

      const event: EventEntry = {
        id: generateId(),
        time: formatTime(),
        type,
      }

      setData(prev =>
        prev
          ? {
              ...prev,
              events: [event, ...prev.events],
            }
          : prev
      )

      try {
        const updated = await apiAddEvent(currentDate, event)
        setData(updated)
        showToast(`Logged: ${type}`)
      } catch (err) {
        console.error('Failed to add event:', err)
        setData(prev =>
          prev
            ? {
                ...prev,
                events: prev.events.filter(e => e.id !== event.id),
              }
            : prev
        )
        showToast('Failed to log event')
      }
    },
    [currentDate, data, showToast]
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      if (!data) return

      const eventToDelete = data.events.find(e => e.id === id)

      setData(prev =>
        prev
          ? {
              ...prev,
              events: prev.events.filter(e => e.id !== id),
            }
          : prev
      )

      try {
        await apiDeleteEvent(id)
      } catch (err) {
        console.error('Failed to delete event:', err)
        if (eventToDelete) {
          setData(prev =>
            prev
              ? {
                  ...prev,
                  events: [...prev.events, eventToDelete],
                }
              : prev
          )
        }
        showToast('Failed to delete event')
      }
    },
    [data, showToast]
  )

  const addQuestion = useCallback(async () => {
    if (!newQuestion.trim() || !data) return

    const question: Question = {
      id: generateId(),
      text: newQuestion.trim(),
      answered: false,
    }

    setData(prev =>
      prev
        ? {
            ...prev,
            questions: [...prev.questions, question],
          }
        : prev
    )
    setNewQuestion('')

    try {
      const updated = await apiAddQuestion(currentDate, question)
      setData(updated)
    } catch (err) {
      console.error('Failed to add question:', err)
      setData(prev =>
        prev
          ? {
              ...prev,
              questions: prev.questions.filter(q => q.id !== question.id),
            }
          : prev
      )
      showToast('Failed to add question')
    }
  }, [currentDate, data, newQuestion, showToast])

  const toggleQuestion = useCallback(
    async (id: string) => {
      if (!data) return

      const question = data.questions.find(q => q.id === id)
      if (!question) return

      const newAnswered = !question.answered

      setData(prev =>
        prev
          ? {
              ...prev,
              questions: prev.questions.map(q =>
                q.id === id ? { ...q, answered: newAnswered } : q
              ),
            }
          : prev
      )

      try {
        await updateQuestionAnswered(id, newAnswered)
      } catch (err) {
        console.error('Failed to update question:', err)
        setData(prev =>
          prev
            ? {
                ...prev,
                questions: prev.questions.map(q =>
                  q.id === id ? { ...q, answered: !newAnswered } : q
                ),
              }
            : prev
        )
        showToast('Failed to update question')
      }
    },
    [data, showToast]
  )

  const deleteQuestion = useCallback(
    async (id: string) => {
      if (!data) return

      const questionToDelete = data.questions.find(q => q.id === id)

      setData(prev =>
        prev
          ? {
              ...prev,
              questions: prev.questions.filter(q => q.id !== id),
            }
          : prev
      )

      try {
        await apiDeleteQuestion(id)
      } catch (err) {
        console.error('Failed to delete question:', err)
        if (questionToDelete) {
          setData(prev =>
            prev
              ? {
                  ...prev,
                  questions: [...prev.questions, questionToDelete],
                }
              : prev
          )
        }
        showToast('Failed to delete question')
      }
    },
    [data, showToast]
  )

  const copySummary = useCallback(async () => {
    if (!data || !settings) return

    const summary = generateSummary(data, settings)
    try {
      await navigator.clipboard.writeText(summary)
      showToast('Summary copied!')
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = summary
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showToast('Summary copied!')
    }
  }, [data, settings, showToast])

  if (loading) {
    return (
      <div className="container">
        <p>Loading...</p>
      </div>
    )
  }

  if (!data || !settings) {
    return (
      <div className="container">
        <p>Failed to load data</p>
      </div>
    )
  }

  const dayNumber = calculateDayNumber(settings.admissionDate, currentDate)

  return (
    <div className="container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="date-display">
          <div className="date-nav">
            <button className="nav-btn" onClick={() => navigateDate(-1)}>
              ‹
            </button>
            <span className="date-main">{formatDate(currentDate)}</span>
            <button className="nav-btn" onClick={() => navigateDate(1)} disabled={isToday}>
              ›
            </button>
          </div>
          {!isToday && (
            <button className="today-btn" onClick={goToToday}>
              Today
            </button>
          )}
          {dayNumber && dayNumber > 0 && (
            <span className="date-sub">Day {dayNumber} in hospital</span>
          )}
        </div>
        <div className="top-bar-actions">
          <button className="btn btn-icon" onClick={() => setShowSettings(true)} title="Settings">
            ⚙️
          </button>
          <button className="btn" onClick={copySummary}>
            📋 Copy
          </button>
        </div>
      </div>

      {/* Admission Date */}
      <div className="section">
        <div className="admission-row">
          <label className="admission-label">Admitted:</label>
          <input
            type="date"
            className="admission-input"
            value={settings.admissionDate || ''}
            onChange={e => updateAdmission(e.target.value || null)}
          />
        </div>
      </div>

      {/* Mood */}
      <div className="section">
        <h2 className="section-title">How are you feeling?</h2>
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

      {/* Dynamic Metrics */}
      {settings.metrics.length > 0 && (
        <div className="section">
          <h2 className="section-title">Your levels</h2>
          {settings.metrics.map(metric => {
            const value = data.metricValues[metric.id] ?? metric.defaultValue
            return (
              <div key={metric.id} className="slider-group">
                <div className="slider-header">
                  <span className="slider-label">
                    {metric.icon && <span className="slider-icon">{metric.icon}</span>}
                    {metric.name}
                  </span>
                  <span className="slider-value">{value}</span>
                </div>
                <input
                  type="range"
                  className="slider"
                  min={metric.minValue}
                  max={metric.maxValue}
                  value={value}
                  onChange={e => updateMetricValue(metric.id, parseInt(e.target.value))}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Notes */}
      <div className="section">
        <h2 className="section-title">What's going on?</h2>
        <textarea
          className="notes-input"
          placeholder="Any symptoms, thoughts, or things to remember..."
          value={data.notes}
          onChange={e => debouncedUpdate({ notes: e.target.value })}
        />
      </div>

      {/* Event Log */}
      {settings.eventTypes.length > 0 && (
        <div className="section">
          <h2 className="section-title">Log an event</h2>

          <div className="event-buttons">
            {settings.eventTypes.map(eventType => (
              <button
                key={eventType.id}
                className="event-btn"
                onClick={() => addEvent(eventType.name)}
              >
                <span className="icon">{eventType.icon}</span>
                {eventType.name}
              </button>
            ))}
          </div>

          <div className="event-log">
            {data.events.length === 0 ? (
              <p className="no-events">No events logged yet</p>
            ) : (
              data.events.map(event => (
                <div key={event.id} className="event-item">
                  <span className="event-time">{event.time}</span>
                  <span className="event-text">{event.type}</span>
                  <button className="event-delete" onClick={() => deleteEvent(event.id)}>
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="section">
        <h2 className="section-title">Questions for the team</h2>

        <div className="question-input-row">
          <input
            type="text"
            className="question-input"
            placeholder="Add a question..."
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addQuestion()}
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
                <button className="question-delete" onClick={() => deleteQuestion(question.id)}>
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          settings={settings}
          onUpdate={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
