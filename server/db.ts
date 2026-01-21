import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'bedside.db')

// Ensure data directory exists
const dataDir = path.dirname(dbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    admission_date TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_metrics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '',
    min_value INTEGER DEFAULT 0,
    max_value INTEGER DEFAULT 10,
    default_value INTEGER DEFAULT 5,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_event_types (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS day_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    mood INTEGER,
    metric_values TEXT DEFAULT '{}',
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    type TEXT NOT NULL,
    note TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    text TEXT NOT NULL,
    answered INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_day_data_user_date ON day_data(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_events_user_date ON events(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_questions_user_date ON questions(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_user_metrics_user ON user_metrics(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_event_types_user ON user_event_types(user_id);
`)

export default db

// Types
export interface Metric {
  id: string
  name: string
  icon: string
  minValue: number
  maxValue: number
  defaultValue: number
  sortOrder: number
}

export interface EventType {
  id: string
  name: string
  icon: string
  sortOrder: number
}

export interface UserSettings {
  metrics: Metric[]
  eventTypes: EventType[]
  admissionDate: string | null
}

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
  metricValues: Record<string, number>
  notes: string
  events: EventEntry[]
  questions: Question[]
}

// Default metrics for new users
const DEFAULT_METRICS: Omit<Metric, 'id'>[] = [
  { name: 'Pain', icon: '🤕', minValue: 0, maxValue: 10, defaultValue: 0, sortOrder: 0 },
  { name: 'Anxiety', icon: '😰', minValue: 0, maxValue: 10, defaultValue: 0, sortOrder: 1 },
  { name: 'Energy', icon: '⚡', minValue: 0, maxValue: 10, defaultValue: 5, sortOrder: 2 },
]

const DEFAULT_EVENT_TYPES: Omit<EventType, 'id'>[] = [
  { name: 'Obs done', icon: '🩺', sortOrder: 0 },
  { name: 'Bloods', icon: '🩸', sortOrder: 1 },
  { name: 'ECG', icon: '💓', sortOrder: 2 },
  { name: 'Scan/X-ray', icon: '📷', sortOrder: 3 },
  { name: 'Doctor round', icon: '👨‍⚕️', sortOrder: 4 },
  { name: 'Medication', icon: '💊', sortOrder: 5 },
  { name: 'Meal', icon: '🍽️', sortOrder: 6 },
]

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// User operations
export function getOrCreateUser(userId: string): void {
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(userId)
  if (!existing) {
    db.prepare('INSERT INTO users (id) VALUES (?)').run(userId)
  }

  // Check if user has metrics, if not create defaults
  const metricCount = db
    .prepare('SELECT COUNT(*) as count FROM user_metrics WHERE user_id = ?')
    .get(userId) as { count: number }
  if (metricCount.count === 0) {
    const insertMetric = db.prepare(`
      INSERT INTO user_metrics (id, user_id, name, icon, min_value, max_value, default_value, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const m of DEFAULT_METRICS) {
      insertMetric.run(
        generateId(),
        userId,
        m.name,
        m.icon,
        m.minValue,
        m.maxValue,
        m.defaultValue,
        m.sortOrder
      )
    }
  }

  // Check if user has event types, if not create defaults
  const eventCount = db
    .prepare('SELECT COUNT(*) as count FROM user_event_types WHERE user_id = ?')
    .get(userId) as { count: number }
  if (eventCount.count === 0) {
    const insertEventType = db.prepare(`
      INSERT INTO user_event_types (id, user_id, name, icon, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `)
    for (const e of DEFAULT_EVENT_TYPES) {
      insertEventType.run(generateId(), userId, e.name, e.icon, e.sortOrder)
    }
  }
}

export function getUserSettings(userId: string): UserSettings {
  getOrCreateUser(userId)

  const metricsRaw = db
    .prepare(
      `
    SELECT id, name, icon, min_value, max_value, default_value, sort_order
    FROM user_metrics WHERE user_id = ? ORDER BY sort_order
  `
    )
    .all(userId) as {
    id: string
    name: string
    icon: string
    min_value: number
    max_value: number
    default_value: number
    sort_order: number
  }[]

  const eventTypesRaw = db
    .prepare(
      `
    SELECT id, name, icon, sort_order
    FROM user_event_types WHERE user_id = ? ORDER BY sort_order
  `
    )
    .all(userId) as { id: string; name: string; icon: string; sort_order: number }[]

  const user = db.prepare('SELECT admission_date FROM users WHERE id = ?').get(userId) as
    | { admission_date: string | null }
    | undefined

  return {
    metrics: metricsRaw.map(m => ({
      id: m.id,
      name: m.name,
      icon: m.icon,
      minValue: m.min_value,
      maxValue: m.max_value,
      defaultValue: m.default_value,
      sortOrder: m.sort_order,
    })),
    eventTypes: eventTypesRaw.map(e => ({
      id: e.id,
      name: e.name,
      icon: e.icon,
      sortOrder: e.sort_order,
    })),
    admissionDate: user?.admission_date ?? null,
  }
}

export function updateAdmissionDate(userId: string, admissionDate: string | null): void {
  db.prepare('UPDATE users SET admission_date = ? WHERE id = ?').run(admissionDate, userId)
}

// Metric operations
export function addMetric(userId: string, metric: Omit<Metric, 'id'>): Metric {
  const id = generateId()
  db.prepare(
    `
    INSERT INTO user_metrics (id, user_id, name, icon, min_value, max_value, default_value, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    userId,
    metric.name,
    metric.icon,
    metric.minValue,
    metric.maxValue,
    metric.defaultValue,
    metric.sortOrder
  )
  return { id, ...metric }
}

export function updateMetric(userId: string, metric: Metric): void {
  db.prepare(
    `
    UPDATE user_metrics SET name = ?, icon = ?, min_value = ?, max_value = ?, default_value = ?, sort_order = ?
    WHERE id = ? AND user_id = ?
  `
  ).run(
    metric.name,
    metric.icon,
    metric.minValue,
    metric.maxValue,
    metric.defaultValue,
    metric.sortOrder,
    metric.id,
    userId
  )
}

export function deleteMetric(userId: string, metricId: string): void {
  db.prepare('DELETE FROM user_metrics WHERE id = ? AND user_id = ?').run(metricId, userId)
}

// Event type operations
export function addEventType(userId: string, eventType: Omit<EventType, 'id'>): EventType {
  const id = generateId()
  db.prepare(
    `
    INSERT INTO user_event_types (id, user_id, name, icon, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `
  ).run(id, userId, eventType.name, eventType.icon, eventType.sortOrder)
  return { id, ...eventType }
}

export function updateEventType(userId: string, eventType: EventType): void {
  db.prepare(
    `
    UPDATE user_event_types SET name = ?, icon = ?, sort_order = ?
    WHERE id = ? AND user_id = ?
  `
  ).run(eventType.name, eventType.icon, eventType.sortOrder, eventType.id, userId)
}

export function deleteEventType(userId: string, eventTypeId: string): void {
  db.prepare('DELETE FROM user_event_types WHERE id = ? AND user_id = ?').run(eventTypeId, userId)
}

// Day data operations
export function getDayData(userId: string, date: string): DayData {
  getOrCreateUser(userId)

  const dayRow = db
    .prepare(
      `
    SELECT date, mood, metric_values, notes
    FROM day_data WHERE user_id = ? AND date = ?
  `
    )
    .get(userId, date) as
    | { date: string; mood: number | null; metric_values: string; notes: string }
    | undefined

  const events = db
    .prepare(
      `
    SELECT id, time, type, note FROM events
    WHERE user_id = ? AND date = ?
    ORDER BY created_at DESC
  `
    )
    .all(userId, date) as EventEntry[]

  const questionsRaw = db
    .prepare(
      `
    SELECT id, text, answered FROM questions
    WHERE user_id = ? AND date = ?
    ORDER BY created_at ASC
  `
    )
    .all(userId, date) as { id: string; text: string; answered: number }[]

  const questions: Question[] = questionsRaw.map(q => ({
    id: q.id,
    text: q.text,
    answered: q.answered === 1,
  }))

  let metricValues: Record<string, number> = {}
  if (dayRow?.metric_values) {
    try {
      metricValues = JSON.parse(dayRow.metric_values)
    } catch {
      metricValues = {}
    }
  }

  return {
    date,
    mood: dayRow?.mood ?? null,
    metricValues,
    notes: dayRow?.notes ?? '',
    events,
    questions,
  }
}

export function updateDayData(
  userId: string,
  date: string,
  data: {
    mood?: number | null
    metricValues?: Record<string, number>
    notes?: string
    admissionDate?: string | null
  }
): void {
  getOrCreateUser(userId)

  const existing = db
    .prepare('SELECT id, metric_values FROM day_data WHERE user_id = ? AND date = ?')
    .get(userId, date) as { id: number; metric_values: string } | undefined

  if (existing) {
    const updates: string[] = []
    const values: (string | number | null)[] = []

    if (data.mood !== undefined) {
      updates.push('mood = ?')
      values.push(data.mood)
    }
    if (data.metricValues !== undefined) {
      // Merge with existing values
      let currentValues: Record<string, number> = {}
      try {
        currentValues = JSON.parse(existing.metric_values || '{}')
      } catch {
        currentValues = {}
      }
      const merged = { ...currentValues, ...data.metricValues }
      updates.push('metric_values = ?')
      values.push(JSON.stringify(merged))
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?')
      values.push(data.notes)
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')")
      values.push(userId, date)
      db.prepare(`UPDATE day_data SET ${updates.join(', ')} WHERE user_id = ? AND date = ?`).run(
        ...values
      )
    }
  } else {
    db.prepare(
      `
      INSERT INTO day_data (user_id, date, mood, metric_values, notes)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run(
      userId,
      date,
      data.mood ?? null,
      JSON.stringify(data.metricValues ?? {}),
      data.notes ?? ''
    )
  }

  if (data.admissionDate !== undefined) {
    updateAdmissionDate(userId, data.admissionDate)
  }
}

// Get list of days with data for historical view
export function getDaysWithData(userId: string, limit: number = 30): string[] {
  const rows = db
    .prepare(
      `
    SELECT DISTINCT date FROM day_data
    WHERE user_id = ?
    ORDER BY date DESC
    LIMIT ?
  `
    )
    .all(userId, limit) as { date: string }[]
  return rows.map(r => r.date)
}

// Event operations
export function addEvent(userId: string, date: string, event: EventEntry): void {
  db.prepare(
    `
    INSERT INTO events (id, user_id, date, time, type, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `
  ).run(event.id, userId, date, event.time, event.type, event.note ?? null)
}

export function deleteEvent(userId: string, eventId: string): void {
  db.prepare('DELETE FROM events WHERE id = ? AND user_id = ?').run(eventId, userId)
}

// Question operations
export function addQuestion(userId: string, date: string, question: Question): void {
  db.prepare(
    `
    INSERT INTO questions (id, user_id, date, text, answered)
    VALUES (?, ?, ?, ?, ?)
  `
  ).run(question.id, userId, date, question.text, question.answered ? 1 : 0)
}

export function updateQuestion(userId: string, questionId: string, answered: boolean): void {
  db.prepare('UPDATE questions SET answered = ? WHERE id = ? AND user_id = ?').run(
    answered ? 1 : 0,
    questionId,
    userId
  )
}

export function deleteQuestion(userId: string, questionId: string): void {
  db.prepare('DELETE FROM questions WHERE id = ? AND user_id = ?').run(questionId, userId)
}
