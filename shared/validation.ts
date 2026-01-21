import { z } from 'zod'

/**
 * Zod validation schemas for API input validation
 * These schemas validate and sanitize user input before processing
 */

// Metric validation
export const MetricSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100).trim(),
  icon: z.string().max(10).default('📊'),
  minValue: z.number().int().min(0).max(100).default(0),
  maxValue: z.number().int().min(1).max(100).default(10),
  defaultValue: z.number().int().min(0).max(100).default(5),
  sortOrder: z.number().int().min(0).default(0),
})

export const CreateMetricSchema = MetricSchema.omit({ id: true })

// Event Type validation
export const EventTypeSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100).trim(),
  icon: z.string().max(10).default('📌'),
  sortOrder: z.number().int().min(0).default(0),
})

export const CreateEventTypeSchema = EventTypeSchema.omit({ id: true })

// Event Entry validation
export const EventEntrySchema = z.object({
  id: z.string().min(1).max(50),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  type: z.string().min(1).max(100).trim(),
  note: z.string().max(500).optional(),
})

// Question validation
export const QuestionSchema = z.object({
  id: z.string().min(1).max(50),
  text: z.string().min(1).max(1000).trim(),
  answered: z.boolean().default(false),
})

// Day data update validation
export const DayDataUpdateSchema = z.object({
  mood: z.number().int().min(0).max(4).nullable().optional(),
  metricValues: z.record(z.string(), z.number().min(0).max(100)).optional(),
  notes: z.string().max(10000).optional(),
  admissionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
})

// Date parameter validation
export const DateParamSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')

// ID parameter validation
export const IdParamSchema = z.string().min(1).max(50)

// Limit query param validation
export const LimitQuerySchema = z.coerce.number().int().min(1).max(365).default(30)

// Question answered update
export const QuestionAnsweredSchema = z.object({
  answered: z.boolean(),
})

// Vitals reading validation
export const VitalsReadingSchema = z.object({
  id: z.string().min(1).max(50),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  type: z.enum([
    'blood_pressure',
    'heart_rate',
    'temperature',
    'oxygen_saturation',
    'respiratory_rate',
    'blood_glucose',
  ]),
  value: z.string().min(1).max(50),
  unit: z.string().max(20),
  note: z.string().max(500).optional(),
})

// Medication validation
export const MedicationSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(200).trim(),
  dosage: z.string().max(100),
  frequency: z.string().max(100),
  icon: z.string().max(10).default('💊'),
  notes: z.string().max(1000).optional(),
  active: z.boolean().default(true),
})

export const CreateMedicationSchema = MedicationSchema.omit({ id: true })

// Care team member validation
export const CareTeamMemberSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(200).trim(),
  role: z.string().min(1).max(100).trim(),
  icon: z.string().max(10).default('👩‍⚕️'),
  notes: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).default(0),
})

export const CreateCareTeamMemberSchema = CareTeamMemberSchema.omit({ id: true })

/**
 * Validation helper that returns typed result
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errorMessages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
  return { success: false, error: errorMessages }
}
