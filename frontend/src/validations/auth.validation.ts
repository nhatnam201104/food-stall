import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').email('Email format is invalid.'),
  password: z.string().min(1, 'Password is required.'),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Owner name must have at least 2 characters.'),
    shopName: z.string().trim().min(2, 'Shop name must have at least 2 characters.'),
    email: z.string().trim().min(1, 'Email is required.').email('Email format is invalid.'),
    phone: z.string().trim().optional(),
    address: z.string().trim().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Confirm password does not match.',
    path: ['confirmPassword'],
  });

export type LoginSchemaValues = z.infer<typeof loginSchema>;
export type RegisterSchemaValues = z.infer<typeof registerSchema>;
