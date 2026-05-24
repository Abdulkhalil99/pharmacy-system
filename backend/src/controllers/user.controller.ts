import { Language, Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/error.middleware';
import {
  userService,
  UserActor,
  UserLinkStatus,
} from '../services/user.service';
import { sendPaginated, sendSuccess } from '../utils/response.helper';

const usernamePattern = /^[A-Za-z0-9]+$/;

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(usernamePattern, 'Username can only contain letters and numbers'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
  role: z.nativeEnum(Role),
  phone: z.string().optional(),
  email: z.email().optional().or(z.literal('')),
  language: z.nativeEnum(Language).optional(),
  isActive: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(usernamePattern, 'Username can only contain letters and numbers')
    .optional(),
  role: z.nativeEnum(Role).optional(),
  phone: z.string().optional(),
  email: z.email().optional().or(z.literal('')),
  language: z.nativeEnum(Language).optional(),
  isActive: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  linkStatus: z.enum(['ALL', 'LINKED', 'UNLINKED']).optional(),
});

const usernameAvailabilitySchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(usernamePattern, 'Username can only contain letters and numbers'),
  excludeId: z.string().optional(),
});

const getParamValue = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

const getActorOrThrow = (req: Request): UserActor => {
  if (!req.user) {
    throw new AppError('Not authenticated.', 401);
  }

  return {
    userId: req.user.userId,
    role: req.user.role,
  };
};

const parseActiveFilter = (value?: 'true' | 'false') => {
  if (value === undefined) {
    return undefined;
  }

  return value === 'true';
};

const parseLinkStatus = (value?: UserLinkStatus) => value ?? 'ALL';

export const userController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = userListQuerySchema.parse(req.query);
      const result = await userService.getAll({
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        search: query.search,
        role: query.role,
        isActive: parseActiveFilter(query.isActive),
        linkStatus: parseLinkStatus(query.linkStatus as UserLinkStatus | undefined),
      });

      sendPaginated(res, result.users, result.total, result.page, result.limit);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = getActorOrThrow(req);
      const user = await userService.getById(getParamValue(req.params.id), actor);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  },

  checkUsername: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = usernameAvailabilitySchema.parse(req.query);
      const result = await userService.checkUsernameAvailability(query.username, query.excludeId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = getActorOrThrow(req);
      const data = createUserSchema.parse(req.body);
      const user = await userService.create(
        {
          name: data.name,
          username: data.username,
          password: data.password,
          role: data.role,
          phone: data.phone,
          email: data.email,
          language: data.language,
          isActive: data.isActive,
        },
        actor
      );
      sendSuccess(res, user, 'User created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = getActorOrThrow(req);
      const data = updateUserSchema.parse(req.body);
      const user = await userService.update(getParamValue(req.params.id), data, actor);
      sendSuccess(res, user, 'User updated successfully');
    } catch (err) {
      next(err);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = getActorOrThrow(req);
      const user = await userService.softDelete(getParamValue(req.params.id), actor);
      sendSuccess(res, user, 'User deactivated successfully');
    } catch (err) {
      next(err);
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = getActorOrThrow(req);
      const data = resetPasswordSchema.parse(req.body);
      const result = await userService.resetPassword(getParamValue(req.params.id), data, actor);
      sendSuccess(res, result, 'Password reset successfully');
    } catch (err) {
      next(err);
    }
  },

  changePassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = getActorOrThrow(req);
      const data = changePasswordSchema.parse(req.body);
      const result = await userService.changePassword(getParamValue(req.params.id), data, actor);
      sendSuccess(res, result, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  },

  toggleActive: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = getActorOrThrow(req);
      const user = await userService.toggleActive(getParamValue(req.params.id), actor);
      sendSuccess(res, user, user.isActive ? 'User activated successfully' : 'User deactivated successfully');
    } catch (err) {
      next(err);
    }
  },
};
