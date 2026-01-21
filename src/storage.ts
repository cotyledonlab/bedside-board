// Re-export shared types for convenience
export type {
  Metric,
  EventType,
  UserSettings,
  EventEntry,
  Question,
  DayData,
  DayDataUpdate,
  VitalsReading,
  VitalsType,
  Medication,
  MedicationDose,
  CareTeamMember,
} from '../shared/types'

export { MOOD_LEVELS, VITALS_TYPES, DEFAULT_CARE_TEAM_ROLES } from '../shared/types'

import type { Metric, EventType, DayData, EventEntry, Question, UserSettings } from '../shared/types'

const API_BASE = import.meta.env.VITE_API_URL || ''

// Get or generate a persistent user ID
function getUserId(): string {
  let userId = localStorage.getItem('bedside-board-user-id')
  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem('bedside-board-user-id', userId)
  }
  return userId
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': getUserId(),
  }
}

// === Settings API ===

export async function loadSettings(): Promise<UserSettings> {
  const res = await fetch(`${API_BASE}/api/settings`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load settings')
  return await res.json()
}

export async function addMetric(metric: Omit<Metric, 'id'>): Promise<Metric> {
  const res = await fetch(`${API_BASE}/api/settings/metrics`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(metric),
  })
  if (!res.ok) throw new Error('Failed to add metric')
  return await res.json()
}

export async function updateMetric(metric: Metric): Promise<void> {
  const res = await fetch(`${API_BASE}/api/settings/metrics/${metric.id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(metric),
  })
  if (!res.ok) throw new Error('Failed to update metric')
}

export async function deleteMetricApi(metricId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/settings/metrics/${metricId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete metric')
}

export async function addEventType(eventType: Omit<EventType, 'id'>): Promise<EventType> {
  const res = await fetch(`${API_BASE}/api/settings/event-types`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(eventType),
  })
  if (!res.ok) throw new Error('Failed to add event type')
  return await res.json()
}

export async function updateEventType(eventType: EventType): Promise<void> {
  const res = await fetch(`${API_BASE}/api/settings/event-types/${eventType.id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(eventType),
  })
  if (!res.ok) throw new Error('Failed to update event type')
}

export async function deleteEventTypeApi(eventTypeId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/settings/event-types/${eventTypeId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete event type')
}

// === Day Data API ===

export async function loadDaysWithData(limit: number = 30): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/days?limit=${limit}`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load days')
  return await res.json()
}

export async function loadDayData(date: string): Promise<DayData> {
  const res = await fetch(`${API_BASE}/api/days/${date}`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load day data')
  return await res.json()
}

export async function updateDayData(
  date: string,
  updates: {
    mood?: number | null
    metricValues?: Record<string, number>
    notes?: string
    admissionDate?: string | null
  }
): Promise<DayData> {
  const res = await fetch(`${API_BASE}/api/days/${date}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update day data')
  return await res.json()
}

export async function addEvent(date: string, event: EventEntry): Promise<DayData> {
  const res = await fetch(`${API_BASE}/api/days/${date}/events`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(event),
  })
  if (!res.ok) throw new Error('Failed to add event')
  return await res.json()
}

export async function deleteEvent(eventId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/events/${eventId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete event')
}

export async function addQuestion(date: string, question: Question): Promise<DayData> {
  const res = await fetch(`${API_BASE}/api/days/${date}/questions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(question),
  })
  if (!res.ok) throw new Error('Failed to add question')
  return await res.json()
}

export async function updateQuestionAnswered(questionId: string, answered: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/api/questions/${questionId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ answered }),
  })
  if (!res.ok) throw new Error('Failed to update question')
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/questions/${questionId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete question')
}

// === Utility functions ===

export function getDateKey(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}

export function calculateDayNumber(
  admissionDate: string | null,
  currentDate: string
): number | null {
  if (!admissionDate) return null

  const admission = new Date(admissionDate)
  const current = new Date(currentDate)
  admission.setHours(0, 0, 0, 0)
  current.setHours(0, 0, 0, 0)

  const diffTime = current.getTime() - admission.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return diffDays + 1
}

export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function generateSummary(data: DayData, settings: UserSettings): string {
  const lines: string[] = []

  const dateStr = formatDateLong(data.date)
  const dayNum = calculateDayNumber(settings.admissionDate, data.date)

  if (dayNum && dayNum > 0) {
    lines.push(`📋 ${dateStr} — Day ${dayNum} in hospital`)
  } else {
    lines.push(`📋 ${dateStr}`)
  }
  lines.push('')

  lines.push("📊 How I'm doing:")

  const moods = ['😫 Terrible', '😔 Not great', '😐 Okay', '🙂 Good', '😄 Great']
  if (data.mood !== null && data.mood >= 0 && data.mood < 5) {
    lines.push(`  Mood: ${moods[data.mood]}`)
  }

  for (const metric of settings.metrics) {
    const value = data.metricValues[metric.id] ?? metric.defaultValue
    lines.push(`  ${metric.name}: ${value}/${metric.maxValue}`)
  }

  if (data.notes.trim()) {
    lines.push('')
    lines.push('💭 Notes:')
    lines.push(`  ${data.notes}`)
  }

  if (data.events.length > 0) {
    lines.push('')
    lines.push("📝 Today's events:")
    data.events.forEach(event => {
      const note = event.note ? ` (${event.note})` : ''
      lines.push(`  ${event.time} — ${event.type}${note}`)
    })
  }

  const unanswered = data.questions.filter(q => !q.answered)
  if (unanswered.length > 0) {
    lines.push('')
    lines.push('❓ Questions for the team:')
    unanswered.forEach(q => {
      lines.push(`  • ${q.text}`)
    })
  }

  const answered = data.questions.filter(q => q.answered)
  if (answered.length > 0) {
    lines.push('')
    lines.push('✅ Answered questions:')
    answered.forEach(q => {
      lines.push(`  • ${q.text}`)
    })
  }

  return lines.join('\n')
}
