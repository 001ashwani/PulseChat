// Unit tests for password validation
import { registerSchema, loginSchema } from '../utils/validation.js';

describe('Password Validation', () => {
  describe('Password Requirements', () => {
    it('should reject passwords less than 8 characters', () => {
      const result = registerSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Pass1!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject passwords without uppercase letters', () => {
      const result = registerSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject passwords without lowercase letters', () => {
      const result = registerSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'PASSWORD123!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      const result = registerSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject passwords without special characters', () => {
      const result = registerSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid strong password', () => {
      const result = registerSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
      });
      expect(result.success).toBe(true);
    });

    it('should accept various special characters', () => {
      const validPasswords = [
        'SecurePass123!',
        'SecurePass123@',
        'SecurePass123#',
        'SecurePass123$',
        'SecurePass123%',
        'SecurePass123^',
        'SecurePass123&',
        'SecurePass123*',
      ];

      validPasswords.forEach(password => {
        const result = registerSchema.safeParse({
          name: 'Test User',
          email: 'test@example.com',
          password,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Email Validation', () => {
    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user name@example.com',
        'user@.com',
      ];

      invalidEmails.forEach(email => {
        const result = registerSchema.safeParse({
          name: 'Test User',
          email,
          password: 'SecurePass123!',
        });
        expect(result.success).toBe(false);
      });
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.co.uk',
        'user+tag@example.com',
        'user123@subdomain.example.com',
      ];

      validEmails.forEach(email => {
        const result = registerSchema.safeParse({
          name: 'Test User',
          email,
          password: 'SecurePass123!',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should normalize email to lowercase', () => {
      const result = registerSchema.safeParse({
        name: 'Test User',
        email: 'Test@EXAMPLE.COM',
        password: 'SecurePass123!',
      });
      expect(result.success).toBe(true);
      expect(result.data.email).toBe('test@example.com');
    });
  });

  describe('Name Validation', () => {
    it('should reject names shorter than 2 characters', () => {
      const result = registerSchema.safeParse({
        name: 'A',
        email: 'test@example.com',
        password: 'SecurePass123!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject names longer than 50 characters', () => {
      const result = registerSchema.safeParse({
        name: 'A'.repeat(51),
        email: 'test@example.com',
        password: 'SecurePass123!',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid names', () => {
      const validNames = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown'];

      validNames.forEach(name => {
        const result = registerSchema.safeParse({
          name,
          email: 'test@example.com',
          password: 'SecurePass123!',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should trim whitespace from name', () => {
      const result = registerSchema.safeParse({
        name: '  John Doe  ',
        email: 'test@example.com',
        password: 'SecurePass123!',
      });
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('John Doe');
    });
  });
});

describe('Login Validation', () => {
  it('should require email', () => {
    const result = loginSchema.safeParse({
      password: 'SecurePass123!',
    });
    expect(result.success).toBe(false);
  });

  it('should require password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid login credentials', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'SecurePass123!',
    });
    expect(result.success).toBe(true);
  });

  it('should normalize email to lowercase', () => {
    const result = loginSchema.safeParse({
      email: 'TEST@EXAMPLE.COM',
      password: 'SecurePass123!',
    });
    expect(result.success).toBe(true);
    expect(result.data.email).toBe('test@example.com');
  });
});
