/**
 * Shared TypeScript types for Bedside Board
 * Used by both frontend and backend to ensure type consistency
 */

/** A trackable metric (e.g., Pain, Anxiety, Energy) */
export interface Metric {
  id: string
  name: string
  icon: string
  minValue: number
  maxValue: number
  defaultValue: number
  sortOrder: number
}

/** A type of event that can be logged (e.g., "Obs done", "Medication") */
export interface EventType {
  id: string
  name: string
  icon: string
  sortOrder: number
}

/** User settings including custom metrics and event types */
export interface UserSettings {
  metrics: Metric[]
  eventTypes: EventType[]
  admissionDate: string | null
}

/** A logged event entry for a specific day */
export interface EventEntry {
  id: string
  time: string
  type: string
  note?: string
}

/** A question for the care team */
export interface Question {
  id: string
  text: string
  answered: boolean
}

/** All data for a specific day */
export interface DayData {
  date: string
  mood: number | null
  metricValues: Record<string, number>
  notes: string
  events: EventEntry[]
  questions: Question[]
}

/** Vitals reading (e.g., blood pressure, temperature) */
export interface VitalsReading {
  id: string
  time: string
  type: VitalsType
  value: string
  unit: string
  note?: string
}

/** Types of vitals that can be tracked */
export type VitalsType =
  | 'blood_pressure'
  | 'heart_rate'
  | 'temperature'
  | 'oxygen_saturation'
  | 'respiratory_rate'
  | 'blood_glucose'

/** Vitals type metadata for display */
export interface VitalsTypeInfo {
  type: VitalsType
  name: string
  icon: string
  unit: string
  placeholder: string
}

/** Medication entry */
export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  icon: string
  notes?: string
  active: boolean
}

/** Medication dose taken */
export interface MedicationDose {
  id: string
  medicationId: string
  time: string
  taken: boolean
  skippedReason?: string
}

/** Care team member contact info */
export interface CareTeamMember {
  id: string
  name: string
  role: string
  icon: string
  notes?: string
  sortOrder: number
}

/** API response wrapper for consistent error handling */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/** Day data update payload */
export interface DayDataUpdate {
  mood?: number | null
  metricValues?: Record<string, number>
  notes?: string
  admissionDate?: string | null
}

/** Mood level descriptions */
export const MOOD_LEVELS = [
  { value: 0, emoji: '😫', label: 'Terrible' },
  { value: 1, emoji: '😔', label: 'Not great' },
  { value: 2, emoji: '😐', label: 'Okay' },
  { value: 3, emoji: '🙂', label: 'Good' },
  { value: 4, emoji: '😄', label: 'Great' },
] as const

/** Available vitals types with metadata */
export const VITALS_TYPES: VitalsTypeInfo[] = [
  {
    type: 'blood_pressure',
    name: 'Blood Pressure',
    icon: '🩺',
    unit: 'mmHg',
    placeholder: '120/80',
  },
  { type: 'heart_rate', name: 'Heart Rate', icon: '💓', unit: 'bpm', placeholder: '72' },
  { type: 'temperature', name: 'Temperature', icon: '🌡️', unit: '°C', placeholder: '36.8' },
  {
    type: 'oxygen_saturation',
    name: 'Oxygen Saturation',
    icon: '🫁',
    unit: '%',
    placeholder: '98',
  },
  {
    type: 'respiratory_rate',
    name: 'Respiratory Rate',
    icon: '💨',
    unit: '/min',
    placeholder: '16',
  },
  { type: 'blood_glucose', name: 'Blood Glucose', icon: '🩸', unit: 'mmol/L', placeholder: '5.5' },
]

/** Default care team roles */
export const DEFAULT_CARE_TEAM_ROLES = [
  { role: 'Primary Doctor', icon: '👨‍⚕️' },
  { role: 'Nurse', icon: '👩‍⚕️' },
  { role: 'Specialist', icon: '🩺' },
  { role: 'Pharmacist', icon: '💊' },
  { role: 'Physiotherapist', icon: '🏃' },
  { role: 'Social Worker', icon: '🤝' },
] as const
