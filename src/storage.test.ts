import { describe, it, expect } from 'vitest'
import { getDateKey, calculateDayNumber, formatTime, formatDate, formatDateLong } from './storage'

describe('getDateKey', () => {
  it('returns today in YYYY-MM-DD format when no date provided', () => {
    const result = getDateKey()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns correct format for a specific date', () => {
    const date = new Date('2024-03-15')
    const result = getDateKey(date)
    expect(result).toBe('2024-03-15')
  })

  it('handles single digit months and days', () => {
    const date = new Date('2024-01-05')
    const result = getDateKey(date)
    expect(result).toBe('2024-01-05')
  })
})

describe('calculateDayNumber', () => {
  it('returns null when admission date is null', () => {
    const result = calculateDayNumber(null, '2024-03-15')
    expect(result).toBeNull()
  })

  it('returns 1 for admission date same as current date', () => {
    const result = calculateDayNumber('2024-03-15', '2024-03-15')
    expect(result).toBe(1)
  })

  it('returns correct day number for dates after admission', () => {
    const result = calculateDayNumber('2024-03-10', '2024-03-15')
    expect(result).toBe(6) // Day 6 (includes admission day)
  })

  it('returns correct day number for one week stay', () => {
    const result = calculateDayNumber('2024-03-01', '2024-03-07')
    expect(result).toBe(7)
  })

  it('handles dates before admission (negative days)', () => {
    const result = calculateDayNumber('2024-03-15', '2024-03-10')
    expect(result).toBe(-4) // Before admission
  })
})

describe('formatTime', () => {
  it('returns time in HH:MM format', () => {
    const result = formatTime()
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })

  it('formats specific time correctly', () => {
    const date = new Date('2024-03-15T14:30:00')
    const result = formatTime(date)
    expect(result).toBe('14:30')
  })

  it('pads single digit hours and minutes', () => {
    const date = new Date('2024-03-15T09:05:00')
    const result = formatTime(date)
    expect(result).toBe('09:05')
  })
})

describe('formatDate', () => {
  it('returns date in short format', () => {
    const result = formatDate('2024-03-15')
    // Format depends on locale, but should include day and month
    expect(result).toContain('15')
    expect(result).toContain('Mar')
  })
})

describe('formatDateLong', () => {
  it('returns date in long format', () => {
    const result = formatDateLong('2024-03-15')
    // Format depends on locale, but should include full month name
    expect(result).toContain('15')
    expect(result).toContain('March')
  })
})
