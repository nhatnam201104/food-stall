import { z } from 'zod';

export const registerSchema = z
	.object({
		fullName: z.string().trim().min(2, 'Full name must have at least 2 characters.'),
		email: z.string().trim().min(1, 'Email is required.').email('Email format is invalid.'),
		phone: z
			.string()
			.trim()
			.regex(/^$|^(\+84|0)?\d{9,10}$/, 'Phone must be a valid Vietnam number.')
			.optional(),
		password: z.string().min(8, 'Password must be at least 8 characters.'),
		confirmPassword: z.string().min(1, 'Please confirm your password.'),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Confirm password does not match.',
		path: ['confirmPassword'],
	});

export type RegisterSchemaValues = z.infer<typeof registerSchema>;

