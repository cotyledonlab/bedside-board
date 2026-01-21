import { describe, it, expect } from 'vitest'
import {
  validate,
  MetricSchema,
  CreateMetricSchema,
  EventTypeSchema,
  EventEntrySchema,
  QuestionSchema,
  DayDataUpdateSchema,
  DateParamSchema,
  IdParamSchema,
} from './validation'

describe('DateParamSchema', () => {
  it('accepts valid date format', () => {
    const result = validate(DateParamSchema, '2024-03-15')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('2024-03-15')
    }
  })

  it('rejects invalid date format', () => {
    const result = validate(DateParamSchema, '03-15-2024')
    expect(result.success).toBe(false)
  })

  it('rejects non-date strings', () => {
    const result = validate(DateParamSchema, 'not-a-date')
    expect(result.success).toBe(false)
  })
})

describe('IdParamSchema', () => {
  it('accepts valid ID', () => {
    const result = validate(IdParamSchema, 'abc123')
    expect(result.success).toBe(true)
  })

  it('rejects empty string', () => {
    const result = validate(IdParamSchema, '')
    expect(result.success).toBe(false)
  })

  it('rejects string over 50 characters', () => {
    const result = validate(IdParamSchema, 'a'.repeat(51))
    expect(result.success).toBe(false)
  })
})

describe('MetricSchema', () => {
  const validMetric = {
    id: 'metric-1',
    name: 'Pain',
    icon: '🤕',
    minValue: 0,
    maxValue: 10,
    defaultValue: 5,
    sortOrder: 0,
  }

  it('accepts valid metric', () => {
    const result = validate(MetricSchema, validMetric)
    expect(result.success).toBe(true)
  })

  it('rejects metric without name', () => {
    const result = validate(MetricSchema, { ...validMetric, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects metric with invalid value range', () => {
    const result = validate(MetricSchema, { ...validMetric, maxValue: 200 })
    expect(result.success).toBe(false)
  })
})

describe('CreateMetricSchema', () => {
  it('accepts metric without id', () => {
    const result = validate(CreateMetricSchema, {
      name: 'Pain',
      icon: '🤕',
      minValue: 0,
      maxValue: 10,
      defaultValue: 5,
      sortOrder: 0,
    })
    expect(result.success).toBe(true)
  })
})

describe('EventTypeSchema', () => {
  it('accepts valid event type', () => {
    const result = validate(EventTypeSchema, {
      id: 'event-1',
      name: 'Medication',
      icon: '💊',
      sortOrder: 0,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = validate(EventTypeSchema, {
      id: 'event-1',
      name: '',
      icon: '💊',
      sortOrder: 0,
    })
    expect(result.success).toBe(false)
  })
})

describe('EventEntrySchema', () => {
  it('accepts valid event entry', () => {
    const result = validate(EventEntrySchema, {
      id: 'entry-1',
      time: '14:30',
      type: 'Medication',
    })
    expect(result.success).toBe(true)
  })

  it('accepts event entry with note', () => {
    const result = validate(EventEntrySchema, {
      id: 'entry-1',
      time: '14:30',
      type: 'Medication',
      note: 'Paracetamol 500mg',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid time format', () => {
    const result = validate(EventEntrySchema, {
      id: 'entry-1',
      time: '2:30 PM',
      type: 'Medication',
    })
    expect(result.success).toBe(false)
  })
})

describe('QuestionSchema', () => {
  it('accepts valid question', () => {
    const result = validate(QuestionSchema, {
      id: 'q-1',
      text: 'When can I go home?',
      answered: false,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty question text', () => {
    const result = validate(QuestionSchema, {
      id: 'q-1',
      text: '',
      answered: false,
    })
    expect(result.success).toBe(false)
  })

  it('rejects question text over 1000 characters', () => {
    const result = validate(QuestionSchema, {
      id: 'q-1',
      text: 'a'.repeat(1001),
      answered: false,
    })
    expect(result.success).toBe(false)
  })
})

describe('DayDataUpdateSchema', () => {
  it('accepts valid mood update', () => {
    const result = validate(DayDataUpdateSchema, { mood: 3 })
    expect(result.success).toBe(true)
  })

  it('accepts null mood', () => {
    const result = validate(DayDataUpdateSchema, { mood: null })
    expect(result.success).toBe(true)
  })

  it('rejects mood outside valid range', () => {
    const result = validate(DayDataUpdateSchema, { mood: 5 })
    expect(result.success).toBe(false)
  })

  it('accepts valid metric values', () => {
    const result = validate(DayDataUpdateSchema, {
      metricValues: { pain: 5, anxiety: 3 },
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid notes', () => {
    const result = validate(DayDataUpdateSchema, {
      notes: 'Feeling better today',
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid admission date', () => {
    const result = validate(DayDataUpdateSchema, {
      admissionDate: '2024-03-15',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid admission date format', () => {
    const result = validate(DayDataUpdateSchema, {
      admissionDate: 'March 15, 2024',
    })
    expect(result.success).toBe(false)
  })
})
