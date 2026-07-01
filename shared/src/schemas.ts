import { z } from 'zod';
import { PROSPECT_STATUSES, UNIT_STATUSES, TOUR_STATUSES, TOUR_OUTCOMES } from './types.js';

export const CreateUnitSchema = z.object({
  number: z.string().min(1, 'Unit number is required'),
  status: z.enum(UNIT_STATUSES as [string, ...string[]]).default('available'),
  rent: z.number().positive('Rent must be a positive number'),
  bedrooms: z.number().int().nonnegative('Bedrooms must be non-negative'),
  bathrooms: z.number().nonnegative('Bathrooms must be non-negative')
});

export const UpdateUnitSchema = CreateUnitSchema.partial();

export const CreateProspectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  status: z.enum(PROSPECT_STATUSES as [string, ...string[]]).default('new'),
  notes: z.string().default(''),
  assignedUnitId: z.string().nullable().optional(),
  tourDate: z.string().nullable().optional()
});

export const UpdateProspectSchema = CreateProspectSchema.partial();

export type CreateUnitInput = z.infer<typeof CreateUnitSchema>;
export type UpdateUnitInput = z.infer<typeof UpdateUnitSchema>;
export type CreateProspectInput = z.infer<typeof CreateProspectSchema>;
export type UpdateProspectInput = z.infer<typeof UpdateProspectSchema>;

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  dueDate: z.string(),
  isCompleted: z.boolean().default(false),
  prospectId: z.string().min(1, 'Prospect ID is required')
});

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  completedAt: z.string().nullable().optional()
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export const CreateTourSchema = z.object({
  prospectId: z.string().min(1, 'Prospect ID is required'),
  unitId: z.string().min(1, 'Unit ID is required'),
  scheduledTime: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date/time format' }),
  status: z.enum(TOUR_STATUSES as [string, ...string[]]).default('scheduled')
});

export const UpdateTourSchema = CreateTourSchema.partial().extend({
  unitId: z.string().nullable().optional(),
  outcome: z.enum(TOUR_OUTCOMES as [string, ...string[]]).nullable().optional()
});

export type CreateTourInput = z.infer<typeof CreateTourSchema>;
export type UpdateTourInput = z.infer<typeof UpdateTourSchema>;
