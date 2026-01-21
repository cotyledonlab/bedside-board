import { useState } from 'react'
import { VITALS_TYPES } from '../storage'
import type { VitalsReading, VitalsType, VitalsTypeInfo } from '../storage'

interface VitalsTrackerProps {
  readings: VitalsReading[]
  onAddReading: (reading: Omit<VitalsReading, 'id'>) => void
  onDeleteReading: (id: string) => void
}

/**
 * Component for tracking patient vitals (blood pressure, heart rate, etc.)
 * Allows patients to record their vital signs with timestamps
 */
export default function VitalsTracker({
  readings,
  onAddReading,
  onDeleteReading,
}: VitalsTrackerProps) {
  const [selectedType, setSelectedType] = useState<VitalsType>('blood_pressure')
  const [value, setValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const currentVitalsType = VITALS_TYPES.find(v => v.type === selectedType) as VitalsTypeInfo

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return

    onAddReading({
      time: new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      type: selectedType,
      value: value.trim(),
      unit: currentVitalsType.unit,
    })

    setValue('')
    setIsAdding(false)
  }

  // Group readings by type for display
  const latestByType = VITALS_TYPES.reduce(
    (acc, vitalsType) => {
      const latest = readings.find(r => r.type === vitalsType.type)
      if (latest) {
        acc[vitalsType.type] = latest
      }
      return acc
    },
    {} as Record<VitalsType, VitalsReading>
  )

  return (
    <section className="section" aria-labelledby="vitals-heading">
      <div className="section-header">
        <h2 id="vitals-heading" className="section-title">
          Vitals
        </h2>
        <button
          className="btn btn-small"
          onClick={() => setIsAdding(!isAdding)}
          aria-expanded={isAdding}
          aria-controls="vitals-form"
        >
          {isAdding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add vitals form */}
      {isAdding && (
        <form id="vitals-form" className="vitals-form" onSubmit={handleSubmit}>
          <div className="vitals-type-selector">
            {VITALS_TYPES.map(vitalsType => (
              <button
                key={vitalsType.type}
                type="button"
                className={`vitals-type-btn ${selectedType === vitalsType.type ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedType(vitalsType.type)
                  setValue('')
                }}
                aria-pressed={selectedType === vitalsType.type}
              >
                <span aria-hidden="true">{vitalsType.icon}</span>
                <span className="vitals-type-name">{vitalsType.name}</span>
              </button>
            ))}
          </div>

          <div className="vitals-input-row">
            <label htmlFor="vitals-value" className="visually-hidden">
              {currentVitalsType.name} value
            </label>
            <input
              id="vitals-value"
              type="text"
              className="vitals-input"
              placeholder={currentVitalsType.placeholder}
              value={value}
              onChange={e => setValue(e.target.value)}
              aria-describedby="vitals-unit"
            />
            <span id="vitals-unit" className="vitals-unit">
              {currentVitalsType.unit}
            </span>
            <button type="submit" className="btn" disabled={!value.trim()}>
              Save
            </button>
          </div>
        </form>
      )}

      {/* Latest readings summary */}
      <div className="vitals-summary" role="list" aria-label="Latest vital readings">
        {VITALS_TYPES.map(vitalsType => {
          const reading = latestByType[vitalsType.type]
          return (
            <div key={vitalsType.type} className="vitals-card" role="listitem">
              <span className="vitals-card-icon" aria-hidden="true">
                {vitalsType.icon}
              </span>
              <div className="vitals-card-content">
                <span className="vitals-card-label">{vitalsType.name}</span>
                {reading ? (
                  <span className="vitals-card-value">
                    {reading.value} {reading.unit}
                    <time className="vitals-card-time" dateTime={reading.time}>
                      {reading.time}
                    </time>
                  </span>
                ) : (
                  <span className="vitals-card-empty">Not recorded</span>
                )}
              </div>
              {reading && (
                <button
                  className="vitals-delete"
                  onClick={() => onDeleteReading(reading.id)}
                  aria-label={`Delete ${vitalsType.name} reading`}
                >
                  <span aria-hidden="true">×</span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Full reading history */}
      {readings.length > 0 && (
        <details className="vitals-history">
          <summary>View all readings ({readings.length})</summary>
          <ul className="vitals-history-list" role="list">
            {readings.map(reading => {
              const vitalsType = VITALS_TYPES.find(v => v.type === reading.type)
              return (
                <li key={reading.id} className="vitals-history-item">
                  <span className="vitals-history-icon" aria-hidden="true">
                    {vitalsType?.icon}
                  </span>
                  <span className="vitals-history-name">{vitalsType?.name}</span>
                  <span className="vitals-history-value">
                    {reading.value} {reading.unit}
                  </span>
                  <time className="vitals-history-time">{reading.time}</time>
                  <button
                    className="vitals-history-delete"
                    onClick={() => onDeleteReading(reading.id)}
                    aria-label={`Delete reading`}
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </section>
  )
}
