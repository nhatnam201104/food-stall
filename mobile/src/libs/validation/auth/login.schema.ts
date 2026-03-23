import { z } from 'zod';

export const loginSchema = z.object({
	email: z.string().trim().min(1, 'Email is required.').email('Email format is invalid.'),
	password: z.string().min(1, 'Password is required.'),
});

export type LoginSchemaValues = z.infer<typeof loginSchema>;

