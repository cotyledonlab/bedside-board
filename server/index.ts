import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import {
  getDayData,
  updateDayData,
  getDaysWithData,
  getUserSettings,
  addMetric,
  updateMetric,
  deleteMetric,
  addEventType,
  updateEventType,
  deleteEventType,
  addEvent,
  deleteEvent,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  type EventEntry,
  type Question,
  type Metric,
  type EventType,
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

// Get user ID from header
const getUserId = (req: express.Request): string => {
  return (req.headers['x-user-id'] as string) || 'default-user'
}

// === Settings API ===

// Get user settings (metrics, event types, admission date)
app.get('/api/settings', (req, res) => {
  try {
    const userId = getUserId(req)
    const settings = getUserSettings(userId)
    res.json(settings)
  } catch (error) {
    console.error('Error getting settings:', error)
    res.status(500).json({ error: 'Failed to get settings' })
  }
})

// === Metrics API ===

app.post('/api/settings/metrics', (req, res) => {
  try {
    const userId = getUserId(req)
    const metric = addMetric(userId, req.body as Omit<Metric, 'id'>)
    res.json(metric)
  } catch (error) {
    console.error('Error adding metric:', error)
    res.status(500).json({ error: 'Failed to add metric' })
  }
})

app.put('/api/settings/metrics/:id', (req, res) => {
  try {
    const userId = getUserId(req)
    const metric: Metric = { ...req.body, id: req.params.id }
    updateMetric(userId, metric)
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating metric:', error)
    res.status(500).json({ error: 'Failed to update metric' })
  }
})

app.delete('/api/settings/metrics/:id', (req, res) => {
  try {
    const userId = getUserId(req)
    deleteMetric(userId, req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting metric:', error)
    res.status(500).json({ error: 'Failed to delete metric' })
  }
})

// === Event Types API ===

app.post('/api/settings/event-types', (req, res) => {
  try {
    const userId = getUserId(req)
    const eventType = addEventType(userId, req.body as Omit<EventType, 'id'>)
    res.json(eventType)
  } catch (error) {
    console.error('Error adding event type:', error)
    res.status(500).json({ error: 'Failed to add event type' })
  }
})

app.put('/api/settings/event-types/:id', (req, res) => {
  try {
    const userId = getUserId(req)
    const eventType: EventType = { ...req.body, id: req.params.id }
    updateEventType(userId, eventType)
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating event type:', error)
    res.status(500).json({ error: 'Failed to update event type' })
  }
})

app.delete('/api/settings/event-types/:id', (req, res) => {
  try {
    const userId = getUserId(req)
    deleteEventType(userId, req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting event type:', error)
    res.status(500).json({ error: 'Failed to delete event type' })
  }
})

// === Day Data API ===

// Get list of days with data
app.get('/api/days', (req, res) => {
  try {
    const userId = getUserId(req)
    const limit = parseInt(req.query.limit as string) || 30
    const days = getDaysWithData(userId, limit)
    res.json(days)
  } catch (error) {
    console.error('Error getting days:', error)
    res.status(500).json({ error: 'Failed to get days' })
  }
})

// Get day data
app.get('/api/days/:date', (req, res) => {
  try {
    const userId = getUserId(req)
    const data = getDayData(userId, req.params.date)
    res.json(data)
  } catch (error) {
    console.error('Error getting day data:', error)
    res.status(500).json({ error: 'Failed to get day data' })
  }
})

// Update day data
app.patch('/api/days/:date', (req, res) => {
  try {
    const userId = getUserId(req)
    updateDayData(userId, req.params.date, req.body)
    const data = getDayData(userId, req.params.date)
    res.json(data)
  } catch (error) {
    console.error('Error updating day data:', error)
    res.status(500).json({ error: 'Failed to update day data' })
  }
})

// === Events API ===

app.post('/api/days/:date/events', (req, res) => {
  try {
    const userId = getUserId(req)
    const event: EventEntry = req.body
    addEvent(userId, req.params.date, event)
    const data = getDayData(userId, req.params.date)
    res.json(data)
  } catch (error) {
    console.error('Error adding event:', error)
    res.status(500).json({ error: 'Failed to add event' })
  }
})

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

// === Questions API ===

app.post('/api/days/:date/questions', (req, res) => {
  try {
    const userId = getUserId(req)
    const question: Question = req.body
    addQuestion(userId, req.params.date, question)
    const data = getDayData(userId, req.params.date)
    res.json(data)
  } catch (error) {
    console.error('Error adding question:', error)
    res.status(500).json({ error: 'Failed to add question' })
  }
})

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
