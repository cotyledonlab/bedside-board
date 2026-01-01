import { useState } from 'react'
import {
  addMetric,
  updateMetric,
  deleteMetricApi,
  addEventType,
  updateEventType,
  deleteEventTypeApi,
  type Metric,
  type EventType,
  type UserSettings
} from './storage'

interface SettingsProps {
  settings: UserSettings
  onUpdate: (settings: UserSettings) => void
  onClose: () => void
}

export default function Settings({ settings, onUpdate, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'events'>('metrics')
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null)
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null)
  const [newMetric, setNewMetric] = useState({ name: '', icon: '' })
  const [newEvent, setNewEvent] = useState({ name: '', icon: '' })

  const handleAddMetric = async () => {
    if (!newMetric.name.trim()) return
    try {
      const metric = await addMetric({
        name: newMetric.name.trim(),
        icon: newMetric.icon || '📊',
        minValue: 0,
        maxValue: 10,
        defaultValue: 5,
        sortOrder: settings.metrics.length
      })
      onUpdate({
        ...settings,
        metrics: [...settings.metrics, metric]
      })
      setNewMetric({ name: '', icon: '' })
    } catch (err) {
      console.error('Failed to add metric:', err)
    }
  }

  const handleUpdateMetric = async (metric: Metric) => {
    try {
      await updateMetric(metric)
      onUpdate({
        ...settings,
        metrics: settings.metrics.map(m => m.id === metric.id ? metric : m)
      })
      setEditingMetric(null)
    } catch (err) {
      console.error('Failed to update metric:', err)
    }
  }

  const handleDeleteMetric = async (metricId: string) => {
    try {
      await deleteMetricApi(metricId)
      onUpdate({
        ...settings,
        metrics: settings.metrics.filter(m => m.id !== metricId)
      })
    } catch (err) {
      console.error('Failed to delete metric:', err)
    }
  }

  const handleAddEvent = async () => {
    if (!newEvent.name.trim()) return
    try {
      const eventType = await addEventType({
        name: newEvent.name.trim(),
        icon: newEvent.icon || '📌',
        sortOrder: settings.eventTypes.length
      })
      onUpdate({
        ...settings,
        eventTypes: [...settings.eventTypes, eventType]
      })
      setNewEvent({ name: '', icon: '' })
    } catch (err) {
      console.error('Failed to add event type:', err)
    }
  }

  const handleUpdateEvent = async (eventType: EventType) => {
    try {
      await updateEventType(eventType)
      onUpdate({
        ...settings,
        eventTypes: settings.eventTypes.map(e => e.id === eventType.id ? eventType : e)
      })
      setEditingEvent(null)
    } catch (err) {
      console.error('Failed to update event type:', err)
    }
  }

  const handleDeleteEvent = async (eventTypeId: string) => {
    try {
      await deleteEventTypeApi(eventTypeId)
      onUpdate({
        ...settings,
        eventTypes: settings.eventTypes.filter(e => e.id !== eventTypeId)
      })
    } catch (err) {
      console.error('Failed to delete event type:', err)
    }
  }

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            Metrics
          </button>
          <button
            className={`settings-tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'metrics' && (
            <div className="settings-list">
              <p className="settings-hint">Track what matters to you</p>

              {settings.metrics.map(metric => (
                <div key={metric.id} className="settings-item">
                  {editingMetric?.id === metric.id ? (
                    <div className="settings-edit-form">
                      <input
                        type="text"
                        className="settings-input emoji-input"
                        value={editingMetric.icon}
                        onChange={e => setEditingMetric({ ...editingMetric, icon: e.target.value })}
                        placeholder="Icon"
                      />
                      <input
                        type="text"
                        className="settings-input"
                        value={editingMetric.name}
                        onChange={e => setEditingMetric({ ...editingMetric, name: e.target.value })}
                        placeholder="Name"
                      />
                      <button className="btn btn-small" onClick={() => handleUpdateMetric(editingMetric)}>
                        Save
                      </button>
                      <button className="btn btn-small btn-secondary" onClick={() => setEditingMetric(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="settings-item-icon">{metric.icon}</span>
                      <span className="settings-item-name">{metric.name}</span>
                      <button className="settings-item-btn" onClick={() => setEditingMetric(metric)}>
                        Edit
                      </button>
                      <button className="settings-item-btn delete" onClick={() => handleDeleteMetric(metric.id)}>
                        ×
                      </button>
                    </>
                  )}
                </div>
              ))}

              <div className="settings-add-form">
                <input
                  type="text"
                  className="settings-input emoji-input"
                  value={newMetric.icon}
                  onChange={e => setNewMetric({ ...newMetric, icon: e.target.value })}
                  placeholder="📊"
                />
                <input
                  type="text"
                  className="settings-input"
                  value={newMetric.name}
                  onChange={e => setNewMetric({ ...newMetric, name: e.target.value })}
                  placeholder="New metric name..."
                  onKeyDown={e => e.key === 'Enter' && handleAddMetric()}
                />
                <button className="btn btn-small" onClick={handleAddMetric}>
                  Add
                </button>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="settings-list">
              <p className="settings-hint">Quick-log buttons for your day</p>

              {settings.eventTypes.map(eventType => (
                <div key={eventType.id} className="settings-item">
                  {editingEvent?.id === eventType.id ? (
                    <div className="settings-edit-form">
                      <input
                        type="text"
                        className="settings-input emoji-input"
                        value={editingEvent.icon}
                        onChange={e => setEditingEvent({ ...editingEvent, icon: e.target.value })}
                        placeholder="Icon"
                      />
                      <input
                        type="text"
                        className="settings-input"
                        value={editingEvent.name}
                        onChange={e => setEditingEvent({ ...editingEvent, name: e.target.value })}
                        placeholder="Name"
                      />
                      <button className="btn btn-small" onClick={() => handleUpdateEvent(editingEvent)}>
                        Save
                      </button>
                      <button className="btn btn-small btn-secondary" onClick={() => setEditingEvent(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="settings-item-icon">{eventType.icon}</span>
                      <span className="settings-item-name">{eventType.name}</span>
                      <button className="settings-item-btn" onClick={() => setEditingEvent(eventType)}>
                        Edit
                      </button>
                      <button className="settings-item-btn delete" onClick={() => handleDeleteEvent(eventType.id)}>
                        ×
                      </button>
                    </>
                  )}
                </div>
              ))}

              <div className="settings-add-form">
                <input
                  type="text"
                  className="settings-input emoji-input"
                  value={newEvent.icon}
                  onChange={e => setNewEvent({ ...newEvent, icon: e.target.value })}
                  placeholder="📌"
                />
                <input
                  type="text"
                  className="settings-input"
                  value={newEvent.name}
                  onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                  placeholder="New event type..."
                  onKeyDown={e => e.key === 'Enter' && handleAddEvent()}
                />
                <button className="btn btn-small" onClick={handleAddEvent}>
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
