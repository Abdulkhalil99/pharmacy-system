import { ExpenseCategory } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/error.middleware';
import { expenseService } from '../services/expense.service';
import { sendSuccess } from '../utils/response.helper';

const expenseSchema = z.object({
  category: z.nativeEnum(ExpenseCategory),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  description: z.string().optional(),
  date: z.string().optional(),
});

const expenseFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
});

const dailySummarySchema = z.object({
  date: z.string().optional(),
});

const monthlySummarySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

const yearlySummarySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

const getParamValue = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export const expenseController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = expenseFilterSchema.parse(req.query);
      const result = await expenseService.getAll(filters);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.userId) {
        throw new AppError('Not authenticated.', 401);
      }

      const data = expenseSchema.parse(req.body);
      const expense = await expenseService.create({
        ...data,
        userId: req.user.userId,
      });
      sendSuccess(res, expense, 'Expense created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = expenseSchema.partial().parse(req.body);
      const expense = await expenseService.update(getParamValue(req.params.id), data);
      sendSuccess(res, expense, 'Expense updated successfully');
    } catch (err) {
      next(err);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await expenseService.delete(getParamValue(req.params.id));
      sendSuccess(res, result, 'Expense deleted successfully');
    } catch (err) {
      next(err);
    }
  },

  getDailySummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = dailySummarySchema.parse(req.query);
      const summary = await expenseService.getDailySummary(filters);
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  },

  getMonthlySummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = monthlySummarySchema.parse(req.query);
      const summary = await expenseService.getMonthlySummary(filters);
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  },

  getYearlySummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = yearlySummarySchema.parse(req.query);
      const summary = await expenseService.getYearlySummary(filters);
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  },
};
