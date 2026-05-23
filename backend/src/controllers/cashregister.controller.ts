import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/error.middleware';
import { cashRegisterService } from '../services/cashregister.service';
import { sendSuccess } from '../utils/response.helper';

const openRegisterSchema = z.object({
  openingBalance: z.coerce.number().min(0, 'Opening balance cannot be negative'),
  note: z.string().trim().optional(),
  date: z.string().trim().optional(),
});

const closeRegisterSchema = z.object({
  closingBalance: z.coerce.number().min(0, 'Closing balance cannot be negative'),
  note: z.string().trim().optional(),
  date: z.string().trim().optional(),
});

const transferSchema = z.object({
  amount: z.coerce.number().positive('Transfer amount must be greater than zero'),
  fromAccount: z.literal('PHARMACY'),
  toAccount: z.string().trim().min(1, 'Destination account is required'),
  reason: z.string().trim().optional(),
  date: z.string().trim().optional(),
});

const transferFiltersSchema = z.object({
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const dailyReportFiltersSchema = z.object({
  date: z.string().trim().optional(),
});

const monthlyReportFiltersSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const cashRegisterController = {
  getTodayStatus: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await cashRegisterService.getTodayStatus();
      sendSuccess(res, status);
    } catch (err) {
      next(err);
    }
  },

  openRegister: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = openRegisterSchema.parse(req.body);
      const register = await cashRegisterService.openRegister(data);
      sendSuccess(res, register, 'Cash register opened successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  closeRegister: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = closeRegisterSchema.parse(req.body);
      const register = await cashRegisterService.closeRegister(data);
      sendSuccess(res, register, 'Cash register closed successfully');
    } catch (err) {
      next(err);
    }
  },

  transferCash: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.userId) {
        throw new AppError('Not authenticated.', 401);
      }

      const data = transferSchema.parse(req.body);
      const result = await cashRegisterService.transferCash({
        ...data,
        userId: req.user.userId,
      });

      sendSuccess(res, result, 'Cash transfer recorded successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  getTransfers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = transferFiltersSchema.parse(req.query);
      const transfers = await cashRegisterService.getTransfers(filters);
      sendSuccess(res, transfers);
    } catch (err) {
      next(err);
    }
  },

  getDailyReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = dailyReportFiltersSchema.parse(req.query);
      const report = await cashRegisterService.getDailyReport(filters);
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },

  getMonthlyReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = monthlyReportFiltersSchema.parse(req.query);
      const report = await cashRegisterService.getMonthlyReport(filters);
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },
};
