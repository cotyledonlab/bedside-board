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

/** Mood options with labels for accessibility */
const MOODS = [
  { emoji: '😫', label: 'Terrible' },
  { emoji: '😔', label: 'Not great' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😄', label: 'Great' },
]

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
      <div className="container" role="status" aria-live="polite" aria-busy="true">
        <p>Loading your health dashboard...</p>
      </div>
    )
  }

  if (!data || !settings) {
    return (
      <div className="container" role="alert">
        <p>Failed to load data. Please try refreshing the page.</p>
      </div>
    )
  }

  const dayNumber = calculateDayNumber(settings.admissionDate, currentDate)

  return (
    <main className="container" role="main" aria-label="Health Dashboard">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="date-display">
          <nav className="date-nav" aria-label="Date navigation">
            <button
              className="nav-btn"
              onClick={() => navigateDate(-1)}
              aria-label="Go to previous day"
            >
              ‹
            </button>
            <span className="date-main" aria-live="polite" aria-atomic="true">
              {formatDate(currentDate)}
            </span>
            <button
              className="nav-btn"
              onClick={() => navigateDate(1)}
              disabled={isToday}
              aria-label="Go to next day"
              aria-disabled={isToday}
            >
              ›
            </button>
          </nav>
          {!isToday && (
            <button className="today-btn" onClick={goToToday} aria-label="Return to today">
              Today
            </button>
          )}
          {dayNumber && dayNumber > 0 && (
            <span className="date-sub" aria-label={`Day ${dayNumber} in hospital`}>
              Day {dayNumber} in hospital
            </span>
          )}
        </div>
        <div className="top-bar-actions">
          <button
            className="btn btn-icon"
            onClick={() => setShowSettings(true)}
            aria-label="Open settings"
            aria-haspopup="dialog"
          >
            <span aria-hidden="true">⚙️</span>
          </button>
          <button
            className="btn"
            onClick={copySummary}
            aria-label="Copy daily summary to clipboard"
          >
            <span aria-hidden="true">📋</span> Copy
          </button>
        </div>
      </header>

      {/* Admission Date */}
      <section className="section" aria-labelledby="admission-heading">
        <h2 id="admission-heading" className="visually-hidden">
          Admission Information
        </h2>
        <div className="admission-row">
          <label htmlFor="admission-date" className="admission-label">
            Admitted:
          </label>
          <input
            id="admission-date"
            type="date"
            className="admission-input"
            value={settings.admissionDate || ''}
            onChange={e => updateAdmission(e.target.value || null)}
            aria-describedby="admission-help"
          />
          <span id="admission-help" className="visually-hidden">
            Enter your hospital admission date
          </span>
        </div>
      </section>

      {/* Mood */}
      <section className="section" aria-labelledby="mood-heading">
        <h2 id="mood-heading" className="section-title">
          How are you feeling?
        </h2>
        <div className="mood-picker" role="radiogroup" aria-labelledby="mood-heading">
          {MOODS.map((mood, index) => (
            <button
              key={index}
              className={`mood-btn ${data.mood === index ? 'selected' : ''}`}
              onClick={() => updateMood(index)}
              role="radio"
              aria-checked={data.mood === index}
              aria-label={mood.label}
            >
              <span aria-hidden="true">{mood.emoji}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Dynamic Metrics */}
      {settings.metrics.length > 0 && (
        <section className="section" aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="section-title">
            Your levels
          </h2>
          {settings.metrics.map(metric => {
            const value = data.metricValues[metric.id] ?? metric.defaultValue
            const sliderId = `slider-${metric.id}`
            return (
              <div key={metric.id} className="slider-group">
                <div className="slider-header">
                  <label htmlFor={sliderId} className="slider-label">
                    {metric.icon && (
                      <span className="slider-icon" aria-hidden="true">
                        {metric.icon}
                      </span>
                    )}
                    {metric.name}
                  </label>
                  <span className="slider-value" aria-live="polite">
                    {value}
                  </span>
                </div>
                <input
                  id={sliderId}
                  type="range"
                  className="slider"
                  min={metric.minValue}
                  max={metric.maxValue}
                  value={value}
                  onChange={e => updateMetricValue(metric.id, parseInt(e.target.value))}
                  aria-valuemin={metric.minValue}
                  aria-valuemax={metric.maxValue}
                  aria-valuenow={value}
                  aria-valuetext={`${metric.name}: ${value} out of ${metric.maxValue}`}
                />
              </div>
            )
          })}
        </section>
      )}

      {/* Notes */}
      <section className="section" aria-labelledby="notes-heading">
        <h2 id="notes-heading" className="section-title">
          What's going on?
        </h2>
        <textarea
          id="notes-input"
          className="notes-input"
          placeholder="Any symptoms, thoughts, or things to remember..."
          value={data.notes}
          onChange={e => debouncedUpdate({ notes: e.target.value })}
          aria-label="Daily notes and symptoms"
          aria-describedby="notes-help"
        />
        <span id="notes-help" className="visually-hidden">
          Record any symptoms, thoughts, or important observations for your care team
        </span>
      </section>

      {/* Event Log */}
      {settings.eventTypes.length > 0 && (
        <section className="section" aria-labelledby="events-heading">
          <h2 id="events-heading" className="section-title">
            Log an event
          </h2>

          <div className="event-buttons" role="group" aria-label="Quick event logging buttons">
            {settings.eventTypes.map(eventType => (
              <button
                key={eventType.id}
                className="event-btn"
                onClick={() => addEvent(eventType.name)}
                aria-label={`Log ${eventType.name}`}
              >
                <span className="icon" aria-hidden="true">
                  {eventType.icon}
                </span>
                {eventType.name}
              </button>
            ))}
          </div>

          <div
            className="event-log"
            role="log"
            aria-label="Today's logged events"
            aria-live="polite"
          >
            {data.events.length === 0 ? (
              <p className="no-events">No events logged yet</p>
            ) : (
              <ul className="event-list" role="list">
                {data.events.map(event => (
                  <li key={event.id} className="event-item">
                    <time className="event-time" dateTime={`${currentDate}T${event.time}`}>
                      {event.time}
                    </time>
                    <span className="event-text">{event.type}</span>
                    <button
                      className="event-delete"
                      onClick={() => deleteEvent(event.id)}
                      aria-label={`Delete ${event.type} event at ${event.time}`}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* Questions */}
      <section className="section" aria-labelledby="questions-heading">
        <h2 id="questions-heading" className="section-title">
          Questions for the team
        </h2>

        <form
          className="question-input-row"
          onSubmit={e => {
            e.preventDefault()
            addQuestion()
          }}
        >
          <label htmlFor="new-question" className="visually-hidden">
            Add a question for your care team
          </label>
          <input
            id="new-question"
            type="text"
            className="question-input"
            placeholder="Add a question..."
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            aria-describedby="question-help"
          />
          <button type="submit" className="btn" disabled={!newQuestion.trim()}>
            Add
          </button>
          <span id="question-help" className="visually-hidden">
            Type your question and press Enter or click Add
          </span>
        </form>

        <div className="questions-list" role="list" aria-label="Questions list">
          {data.questions.length === 0 ? (
            <p className="no-questions">No questions yet</p>
          ) : (
            data.questions.map(question => (
              <div key={question.id} className="question-item" role="listitem">
                <input
                  type="checkbox"
                  id={`question-${question.id}`}
                  className="question-checkbox"
                  checked={question.answered}
                  onChange={() => toggleQuestion(question.id)}
                  aria-label={`Mark question as ${question.answered ? 'unanswered' : 'answered'}`}
                />
                <label
                  htmlFor={`question-${question.id}`}
                  className={`question-text ${question.answered ? 'answered' : ''}`}
                >
                  {question.text}
                </label>
                <button
                  className="question-delete"
                  onClick={() => deleteQuestion(question.id)}
                  aria-label={`Delete question: ${question.text}`}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Toast notification */}
      {toast && (
        <div className="toast" role="status" aria-live="polite" aria-atomic="true">
          {toast}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          settings={settings}
          onUpdate={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  )
}
