import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import {
  getDayData,
  updateDayData,
  addEvent,
  deleteEvent,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  type EventEntry,
  type Question
} from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

console.log('Starting server...')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('PORT:', PORT)
console.log('__dirname:', __dirname)

app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// For now, use a simple user ID (in production, add proper auth)
const getUserId = (req: express.Request): string => {
  return req.headers['x-user-id'] as string || 'default-user'
}

const getDateParam = (req: express.Request): string => {
  return req.params.date || new Date().toISOString().split('T')[0]
}

// API Routes

// Get day data
app.get('/api/days/:date', (req, res) => {
  try {
    const userId = getUserId(req)
    const date = getDateParam(req)
    const data = getDayData(userId, date)
    res.json(data)
  } catch (error) {
    console.error('Error getting day data:', error)
    res.status(500).json({ error: 'Failed to get day data' })
  }
})

// Update day data (mood, pain, anxiety, energy, notes, admissionDate)
app.patch('/api/days/:date', (req, res) => {
  try {
    const userId = getUserId(req)
    const date = getDateParam(req)
    updateDayData(userId, date, req.body)
    const data = getDayData(userId, date)
    res.json(data)
  } catch (error) {
    console.error('Error updating day data:', error)
    res.status(500).json({ error: 'Failed to update day data' })
  }
})

// Add event
app.post('/api/days/:date/events', (req, res) => {
  try {
    const userId = getUserId(req)
    const date = getDateParam(req)
    const event: EventEntry = req.body
    addEvent(userId, date, event)
    const data = getDayData(userId, date)
    res.json(data)
  } catch (error) {
    console.error('Error adding event:', error)
    res.status(500).json({ error: 'Failed to add event' })
  }
})

// Delete event
app.delete('/api/events/:id', (req, res) => {
  try {
    const userId = getUserId(req)
    deleteEvent(userId, req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    res.status(500).json({ error: 'Failed to delete event' })
  }
})

// Add question
app.post('/api/days/:date/questions', (req, res) => {
  try {
    const userId = getUserId(req)
    const date = getDateParam(req)
    const question: Question = req.body
    addQuestion(userId, date, question)
    const data = getDayData(userId, date)
    res.json(data)
  } catch (error) {
    console.error('Error adding question:', error)
    res.status(500).json({ error: 'Failed to add question' })
  }
})

// Update question (toggle answered)
app.patch('/api/questions/:id', (req, res) => {
  try {
    const userId = getUserId(req)
    updateQuestion(userId, req.params.id, req.body.answered)
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating question:', error)
    res.status(500).json({ error: 'Failed to update question' })
  }
})

// Delete question
app.delete('/api/questions/:id', (req, res) => {
  try {
    const userId = getUserId(req)
    deleteQuestion(userId, req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting question:', error)
    res.status(500).json({ error: 'Failed to delete question' })
  }
})

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.resolve(__dirname, '..', 'dist')
  console.log('Static path:', staticPath)
  console.log('Static path exists:', fs.existsSync(staticPath))

  if (fs.existsSync(staticPath)) {
    console.log('Static files:', fs.readdirSync(staticPath))
    app.use(express.static(staticPath))
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'))
    })
  } else {
    console.error('Static path does not exist!')
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
