import { z } from 'zod';

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ─── Workspace Schemas ────────────────────────────────────────────────────────

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

// ─── Document Schemas ─────────────────────────────────────────────────────────

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.union([z.string(), z.record(z.unknown())]).optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.union([z.string(), z.record(z.unknown())]).optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

// ─── Pagination ───────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
