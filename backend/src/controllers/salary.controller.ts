import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/error.middleware';
import { salaryService } from '../services/salary.service';
import { sendSuccess } from '../utils/response.helper';

const salaryFiltersSchema = z.object({
  employeeId: z.string().optional(),
  employeeName: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

const salaryPaymentSchema = z.object({
  employeeId: z.string().optional(),
  employeeName: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  note: z.string().optional(),
  date: z.string().optional(),
}).refine((data) => Boolean(data.employeeId || data.employeeName?.trim()), {
  message: 'Employee is required',
  path: ['employeeId'],
});

const salarySummarySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

const getParamValue = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export const salaryController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = salaryFiltersSchema.parse(req.query);
      const result = await salaryService.getAll(filters);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  recordPayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.userId) {
        throw new AppError('Not authenticated.', 401);
      }

      const data = salaryPaymentSchema.parse(req.body);
      const result = await salaryService.recordPayment({
        ...data,
        userId: req.user.userId,
      });
      sendSuccess(res, result, 'Salary payment recorded successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  getEmployeeHistory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await salaryService.getEmployeeHistory(getParamValue(req.params.name));
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  getSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = salarySummarySchema.parse(req.query);
      const summary = await salaryService.getSummary(filters);
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  },
};
