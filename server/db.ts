import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'bedside.db')

// Ensure data directory exists
import fs from 'fs'
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

  CREATE TABLE IF NOT EXISTS day_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    mood INTEGER,
    pain INTEGER DEFAULT 0,
    anxiety INTEGER DEFAULT 0,
    energy INTEGER DEFAULT 5,
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
`)

export default db

// Types
export interface DayData {
  date: string
  mood: number | null
  pain: number
  anxiety: number
  energy: number
  notes: string
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

export interface FullDayData extends DayData {
  events: EventEntry[]
  questions: Question[]
}

// Database operations
export function getOrCreateUser(userId: string): { id: string; admission_date: string | null } {
  const existing = db.prepare('SELECT id, admission_date FROM users WHERE id = ?').get(userId) as { id: string; admission_date: string | null } | undefined
  if (existing) return existing

  db.prepare('INSERT INTO users (id) VALUES (?)').run(userId)
  return { id: userId, admission_date: null }
}

export function updateAdmissionDate(userId: string, admissionDate: string | null): void {
  db.prepare('UPDATE users SET admission_date = ? WHERE id = ?').run(admissionDate, userId)
}

export function getAdmissionDate(userId: string): string | null {
  const user = db.prepare('SELECT admission_date FROM users WHERE id = ?').get(userId) as { admission_date: string | null } | undefined
  return user?.admission_date ?? null
}

export function getDayData(userId: string, date: string): FullDayData {
  getOrCreateUser(userId)

  const dayRow = db.prepare(`
    SELECT date, mood, pain, anxiety, energy, notes
    FROM day_data WHERE user_id = ? AND date = ?
  `).get(userId, date) as Omit<DayData, 'admissionDate'> | undefined

  const events = db.prepare(`
    SELECT id, time, type, note FROM events
    WHERE user_id = ? AND date = ?
    ORDER BY created_at DESC
  `).all(userId, date) as EventEntry[]

  const questionsRaw = db.prepare(`
    SELECT id, text, answered FROM questions
    WHERE user_id = ? AND date = ?
    ORDER BY created_at ASC
  `).all(userId, date) as { id: string; text: string; answered: number }[]

  const questions: Question[] = questionsRaw.map(q => ({
    id: q.id,
    text: q.text,
    answered: q.answered === 1
  }))

  const admissionDate = getAdmissionDate(userId)

  return {
    date,
    mood: dayRow?.mood ?? null,
    pain: dayRow?.pain ?? 0,
    anxiety: dayRow?.anxiety ?? 0,
    energy: dayRow?.energy ?? 5,
    notes: dayRow?.notes ?? '',
    admissionDate,
    events,
    questions
  }
}

export function updateDayData(userId: string, date: string, data: Partial<DayData>): void {
  getOrCreateUser(userId)

  const existing = db.prepare('SELECT id FROM day_data WHERE user_id = ? AND date = ?').get(userId, date)

  if (existing) {
    const updates: string[] = []
    const values: (string | number | null)[] = []

    if (data.mood !== undefined) { updates.push('mood = ?'); values.push(data.mood) }
    if (data.pain !== undefined) { updates.push('pain = ?'); values.push(data.pain) }
    if (data.anxiety !== undefined) { updates.push('anxiety = ?'); values.push(data.anxiety) }
    if (data.energy !== undefined) { updates.push('energy = ?'); values.push(data.energy) }
    if (data.notes !== undefined) { updates.push('notes = ?'); values.push(data.notes) }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')")
      values.push(userId, date)
      db.prepare(`UPDATE day_data SET ${updates.join(', ')} WHERE user_id = ? AND date = ?`).run(...values)
    }
  } else {
    db.prepare(`
      INSERT INTO day_data (user_id, date, mood, pain, anxiety, energy, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      date,
      data.mood ?? null,
      data.pain ?? 0,
      data.anxiety ?? 0,
      data.energy ?? 5,
      data.notes ?? ''
    )
  }

  if (data.admissionDate !== undefined) {
    updateAdmissionDate(userId, data.admissionDate)
  }
}

export function addEvent(userId: string, date: string, event: EventEntry): void {
  db.prepare(`
    INSERT INTO events (id, user_id, date, time, type, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(event.id, userId, date, event.time, event.type, event.note ?? null)
}

export function deleteEvent(userId: string, eventId: string): void {
  db.prepare('DELETE FROM events WHERE id = ? AND user_id = ?').run(eventId, userId)
}

export function addQuestion(userId: string, date: string, question: Question): void {
  db.prepare(`
    INSERT INTO questions (id, user_id, date, text, answered)
    VALUES (?, ?, ?, ?, ?)
  `).run(question.id, userId, date, question.text, question.answered ? 1 : 0)
}

export function updateQuestion(userId: string, questionId: string, answered: boolean): void {
  db.prepare('UPDATE questions SET answered = ? WHERE id = ? AND user_id = ?').run(answered ? 1 : 0, questionId, userId)
}

export function deleteQuestion(userId: string, questionId: string): void {
  db.prepare('DELETE FROM questions WHERE id = ? AND user_id = ?').run(questionId, userId)
}
