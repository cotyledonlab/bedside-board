export interface EventEntry {
  id: string
  time: string
  type: string
  note?: string
}

export interface Question {
  id: string
  text: string
  answered: boolean
}

export interface DayData {
  date: string
  mood: number | null
  pain: number
  anxiety: number
  energy: number
  notes: string
  events: EventEntry[]
  questions: Question[]
  admissionDate: string | null
}

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
    'X-User-Id': getUserId()
  }
}

function getDateKey(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}

export async function loadDayData(date: Date = new Date()): Promise<DayData> {
  const dateKey = getDateKey(date)
  try {
    const res = await fetch(`${API_BASE}/api/days/${dateKey}`, {
      headers: getHeaders()
    })
    if (!res.ok) throw new Error('Failed to load')
    return await res.json()
  } catch (error) {
    console.error('Error loading day data:', error)
    // Return default data on error
    return {
      date: dateKey,
      mood: null,
      pain: 0,
      anxiety: 0,
      energy: 5,
      notes: '',
      events: [],
      questions: [],
      admissionDate: null,
    }
  }
}

export async function updateDayData(date: string, updates: Partial<DayData>): Promise<DayData> {
  const res = await fetch(`${API_BASE}/api/days/${date}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updates)
  })
  if (!res.ok) throw new Error('Failed to update')
  return await res.json()
}

export async function addEvent(date: string, event: EventEntry): Promise<DayData> {
  const res = await fetch(`${API_BASE}/api/days/${date}/events`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(event)
  })
  if (!res.ok) throw new Error('Failed to add event')
  return await res.json()
}

export async function deleteEvent(eventId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/events/${eventId}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to delete event')
}

export async function addQuestion(date: string, question: Question): Promise<DayData> {
  const res = await fetch(`${API_BASE}/api/days/${date}/questions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(question)
  })
  if (!res.ok) throw new Error('Failed to add question')
  return await res.json()
}

export async function updateQuestionAnswered(questionId: string, answered: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/api/questions/${questionId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ answered })
  })
  if (!res.ok) throw new Error('Failed to update question')
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/questions/${questionId}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to delete question')
}

export function calculateDayNumber(admissionDate: string | null): number | null {
  if (!admissionDate) return null

  const admission = new Date(admissionDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  admission.setHours(0, 0, 0, 0)

  const diffTime = today.getTime() - admission.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return diffDays + 1 // Day 1 is admission day
}

export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function generateSummary(data: DayData): string {
  const lines: string[] = []

  // Header
  const date = new Date(data.date)
  const dateStr = date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
  const dayNum = calculateDayNumber(data.admissionDate)

  if (dayNum) {
    lines.push(`📋 ${dateStr} — Day ${dayNum} in hospital`)
  } else {
    lines.push(`📋 ${dateStr}`)
  }
  lines.push('')

  // Current state
  lines.push('📊 How I\'m doing:')

  const moods = ['😫 Terrible', '😔 Not great', '😐 Okay', '🙂 Good', '😄 Great']
  if (data.mood !== null && data.mood >= 0 && data.mood < 5) {
    lines.push(`  Mood: ${moods[data.mood]}`)
  }

  lines.push(`  Pain: ${data.pain}/10`)
  lines.push(`  Anxiety: ${data.anxiety}/10`)
  lines.push(`  Energy: ${data.energy}/10`)

  if (data.notes.trim()) {
    lines.push('')
    lines.push('💭 Notes:')
    lines.push(`  ${data.notes}`)
  }

  // Events
  if (data.events.length > 0) {
    lines.push('')
    lines.push('📝 Today\'s events:')
    data.events.forEach(event => {
      const note = event.note ? ` (${event.note})` : ''
      lines.push(`  ${event.time} — ${event.type}${note}`)
    })
  }

  // Unanswered questions
  const unanswered = data.questions.filter(q => !q.answered)
  if (unanswered.length > 0) {
    lines.push('')
    lines.push('❓ Questions for the team:')
    unanswered.forEach(q => {
      lines.push(`  • ${q.text}`)
    })
  }

  // Answered questions
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
