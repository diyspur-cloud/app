import { z } from 'zod';
export const createClubSchema = z.object({ requestId: z.string().uuid(), name: z.string().trim().min(3).max(80), description: z.string().trim().max(2000), isPrivate: z.boolean() }).strict();
export const updateClubSchema = z.object({ clubId: z.string().uuid(), version: z.number().int().positive(), name: z.string().trim().min(3).max(80), description: z.string().trim().max(2000), isPrivate: z.boolean() }).strict();
export const clubIdSchema = z.object({ clubId: z.string().uuid() }).strict();
