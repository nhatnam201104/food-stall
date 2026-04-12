import { z } from 'zod';
import { isValidPhone } from '../../../utils/phone.util';

export const registerSchema = z
	.object({
		fullName: z.string().trim().min(2, 'Full name must have at least 2 characters.'),
		email: z.string().trim().min(1, 'Email is required.').email('Email format is invalid.'),
		phone: z
			.string()
			.trim()
			.refine((val) => !val || isValidPhone(val, 'VN'), 'Invalid phone number. Use local format (e.g. 0912345678) or international format (e.g. +84912345678, +15551234567).')
			.optional(),
		password: z.string().min(8, 'Password must be at least 8 characters.'),
		confirmPassword: z.string().min(1, 'Please confirm your password.'),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Confirm password does not match.',
		path: ['confirmPassword'],
	});

export type RegisterSchemaValues = z.infer<typeof registerSchema>;

