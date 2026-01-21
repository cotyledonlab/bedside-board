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
} from './db.js'
import {
  validate,
  CreateMetricSchema,
  MetricSchema,
  CreateEventTypeSchema,
  EventTypeSchema,
  EventEntrySchema,
  QuestionSchema,
  DayDataUpdateSchema,
  DateParamSchema,
  IdParamSchema,
  LimitQuerySchema,
  QuestionAnsweredSchema,
} from '../shared/validation.js'

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

// Get user ID from header (validate UUID format)
const getUserId = (req: express.Request): string => {
  const userId = req.headers['x-user-id'] as string
  if (!userId || typeof userId !== 'string' || userId.length > 100) {
    return 'default-user'
  }
  return userId
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
    const validation = validate(CreateMetricSchema, req.body)
    if (!validation.success) {
      res.status(400).json({ error: validation.error })
      return
    }
    const metric = addMetric(userId, validation.data)
    res.json(metric)
  } catch (error) {
    console.error('Error adding metric:', error)
    res.status(500).json({ error: 'Failed to add metric' })
  }
})

app.put('/api/settings/metrics/:id', (req, res) => {
  try {
    const userId = getUserId(req)
    const idValidation = validate(IdParamSchema, req.params.id)
    if (!idValidation.success) {
      res.status(400).json({ error: idValidation.error })
      return
    }
    const validation = validate(MetricSchema, { ...req.body, id: req.params.id })
    if (!validation.success) {
      res.status(400).json({ error: validation.error })
      return
    }
    updateMetric(userId, validation.data)
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating metric:', error)
    res.status(500).json({ error: 'Failed to update metric' })
  }
})

app.delete('/api/settings/metrics/:id', (req, res) => {
  try {
    const userId = getUserId(req)
    const idValidation = validate(IdParamSchema, req.params.id)
    if (!idValidation.success) {
      res.status(400).json({ error: idValidation.error })
      return
    }
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
    const validation = validate(CreateEventTypeSchema, req.body)
    if (!validation.success) {
      res.status(400).json({ error: validation.error })
      return
    }
    const eventType = addEventType(userId, validation.data)
    res.json(eventType)
  } catch (error) {
    console.error('Error adding event type:', error)
    res.status(500).json({ error: 'Failed to add event type' })
  }
})

app.put('/api/settings/event-types/:id', (req, res) => {
  try {
    const userId = getUserId(req)
    const idValidation = validate(IdParamSchema, req.params.id)
    if (!idValidation.success) {
      res.status(400).json({ error: idValidation.error })
      return
    }
    const validation = validate(EventTypeSchema, { ...req.body, id: req.params.id })
    if (!validation.success) {
      res.status(400).json({ error: validation.error })
      return
    }
    updateEventType(userId, validation.data)
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating event type:', error)
    res.status(500).json({ error: 'Failed to update event type' })
  }
})

app.delete('/api/settings/event-types/:id', (req, res) => {
  try {
    const userId = getUserId(req)
    const idValidation = validate(IdParamSchema, req.params.id)
    if (!idValidation.success) {
      res.status(400).json({ error: idValidation.error })
      return
    }
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
    const limitValidation = validate(LimitQuerySchema, req.query.limit || 30)
    if (!limitValidation.success) {
      res.status(400).json({ error: limitValidation.error })
      return
    }
    const days = getDaysWithData(userId, limitValidation.data)
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
    const dateValidation = validate(DateParamSchema, req.params.date)
    if (!dateValidation.success) {
      res.status(400).json({ error: dateValidation.error })
      return
    }
    const data = getDayData(userId, dateValidation.data)
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
    const dateValidation = validate(DateParamSchema, req.params.date)
    if (!dateValidation.success) {
      res.status(400).json({ error: dateValidation.error })
      return
    }
    const bodyValidation = validate(DayDataUpdateSchema, req.body)
    if (!bodyValidation.success) {
      res.status(400).json({ error: bodyValidation.error })
      return
    }
    updateDayData(userId, dateValidation.data, bodyValidation.data)
    const data = getDayData(userId, dateValidation.data)
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
    const dateValidation = validate(DateParamSchema, req.params.date)
    if (!dateValidation.success) {
      res.status(400).json({ error: dateValidation.error })
      return
    }
    const eventValidation = validate(EventEntrySchema, req.body)
    if (!eventValidation.success) {
      res.status(400).json({ error: eventValidation.error })
      return
    }
    addEvent(userId, dateValidation.data, eventValidation.data)
    const data = getDayData(userId, dateValidation.data)
    res.json(data)
  } catch (error) {
    console.error('Error adding event:', error)
    res.status(500).json({ error: 'Failed to add event' })
  }
})

app.delete('/api/events/:id', (req, res) => {
  try {
    const userId = getUserId(req)
    const idValidation = validate(IdParamSchema, req.params.id)
    if (!idValidation.success) {
      res.status(400).json({ error: idValidation.error })
      return
    }
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
    const dateValidation = validate(DateParamSchema, req.params.date)
    if (!dateValidation.success) {
      res.status(400).json({ error: dateValidation.error })
      return
    }
    const questionValidation = validate(QuestionSchema, req.body)
    if (!questionValidation.success) {
      res.status(400).json({ error: questionValidation.error })
      return
    }
    addQuestion(userId, dateValidation.data, questionValidation.data)
    const data = getDayData(userId, dateValidation.data)
    res.json(data)
  } catch (error) {
    console.error('Error adding question:', error)
    res.status(500).json({ error: 'Failed to add question' })
  }
})

app.patch('/api/questions/:id', (req, res) => {
  try {
    const userId = getUserId(req)
    const idValidation = validate(IdParamSchema, req.params.id)
    if (!idValidation.success) {
      res.status(400).json({ error: idValidation.error })
      return
    }
    const bodyValidation = validate(QuestionAnsweredSchema, req.body)
    if (!bodyValidation.success) {
      res.status(400).json({ error: bodyValidation.error })
      return
    }
    updateQuestion(userId, req.params.id, bodyValidation.data.answered)
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating question:', error)
    res.status(500).json({ error: 'Failed to update question' })
  }
})

app.delete('/api/questions/:id', (req, res) => {
  try {
    const userId = getUserId(req)
    const idValidation = validate(IdParamSchema, req.params.id)
    if (!idValidation.success) {
      res.status(400).json({ error: idValidation.error })
      return
    }
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
