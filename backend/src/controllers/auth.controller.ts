import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response.helper';

// ─── Validation Schemas ───────────────────────────────────────────────────────
// Zod validates the request body shape before we even touch the database.
// If validation fails, it throws a ZodError which our globalErrorHandler catches.
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const authController = {
  // POST /api/auth/login
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const result = await authService.login(username, password);
      sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/logout
  // JWT is stateless — we can't truly invalidate it server-side without a
  // token blacklist. For this system, logout is handled client-side by
  // deleting the token from storage. The endpoint exists for API consistency.
  logout: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  },

  // GET /api/auth/me
  me: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getMe(req.user!.userId);
      sendSuccess(res, user, 'User retrieved');
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/auth/change-password
  changePassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      await authService.changePassword(req.user!.userId, currentPassword, newPassword);
      sendSuccess(res, null, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  },
};