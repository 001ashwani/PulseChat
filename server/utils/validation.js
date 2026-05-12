import { z } from 'zod';

// Password must be at least 8 characters, contain uppercase, lowercase, number, and special character
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[!@#$%^&*]/, 'Password must contain special character (!@#$%^&*)');

const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase();

const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .trim();

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const messageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message is too long')
    .trim(),
});

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

export const validateInput = (schema, data) => {
  const result = schema.safeParse(data);
  return {
    success: result.success,
    data: result.data,
    errors: result.error?.flatten().fieldErrors || null,
  };
};
