import { Language, Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/response.helper';

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(Role),
  language: z.nativeEnum(Language).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  username: z.string().min(1, 'Username is required').optional(),
  role: z.nativeEnum(Role).optional(),
  language: z.nativeEnum(Language).optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

const getParamValue = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export const userController = {
  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userService.getAll();
      sendSuccess(res, users);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createUserSchema.parse(req.body);
      const user = await userService.create(data);
      sendSuccess(res, user, 'User created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateUserSchema.parse(req.body);
      const user = await userService.update(
        getParamValue(req.params.id),
        data,
        req.user?.userId
      );
      sendSuccess(res, user, 'User updated successfully');
    } catch (err) {
      next(err);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await userService.remove(getParamValue(req.params.id), req.user?.userId);
      sendSuccess(res, result, 'User deleted successfully');
    } catch (err) {
      next(err);
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = resetPasswordSchema.parse(req.body);
      const result = await userService.resetPassword(
        getParamValue(req.params.id),
        data,
        req.user?.userId
      );
      sendSuccess(res, result, 'Password reset successfully');
    } catch (err) {
      next(err);
    }
  },
};
