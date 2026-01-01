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

const STORAGE_KEY = 'bedside-board'

function getDateKey(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}

function getDefaultDayData(dateKey: string): DayData {
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

export function loadDayData(date: Date = new Date()): DayData {
  const dateKey = getDateKey(date)

  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}-${dateKey}`)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...getDefaultDayData(dateKey), ...parsed }
    }
  } catch (e) {
    console.error('Error loading day data:', e)
  }

  // Try to get admission date from previous days
  const admissionDate = getAdmissionDate()
  const defaultData = getDefaultDayData(dateKey)
  if (admissionDate) {
    defaultData.admissionDate = admissionDate
  }

  return defaultData
}

export function saveDayData(data: DayData): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}-${data.date}`, JSON.stringify(data))

    // Also save admission date globally if set
    if (data.admissionDate) {
      localStorage.setItem(`${STORAGE_KEY}-admission`, data.admissionDate)
    }
  } catch (e) {
    console.error('Error saving day data:', e)
  }
}

export function getAdmissionDate(): string | null {
  try {
    return localStorage.getItem(`${STORAGE_KEY}-admission`)
  } catch {
    return null
  }
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
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
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
