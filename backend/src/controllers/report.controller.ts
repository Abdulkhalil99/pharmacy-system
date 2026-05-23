import { ExpenseCategory } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { reportService } from '../services/report.service';
import { sendSuccess } from '../utils/response.helper';

const dailyQuerySchema = z.object({
  date: z.string().optional(),
});

const weeklyQuerySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
});

const monthlyQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

const yearlyQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

const limitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const profitQuerySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
});

const expenseReportQuerySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
});

export const reportController = {
  getDailyReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = dailyQuerySchema.parse(req.query);
      const report = await reportService.getDailyReport(query.date);
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },

  getWeeklyReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = weeklyQuerySchema.parse(req.query);
      const report = await reportService.getWeeklyReport(query);
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },

  getMonthlyReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = monthlyQuerySchema.parse(req.query);
      const report = await reportService.getMonthlyReport(query);
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },

  getYearlyReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = yearlyQuerySchema.parse(req.query);
      const report = await reportService.getYearlyReport(query);
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },

  getInventoryReport: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await reportService.getInventoryReport();
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },

  getTopSellingMedicines: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = limitQuerySchema.parse(req.query);
      const report = await reportService.getMedicineSalesReport(query.limit ?? 10, 'top');
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },

  getLeastSellingMedicines: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = limitQuerySchema.parse(req.query);
      const report = await reportService.getMedicineSalesReport(query.limit ?? 10, 'least');
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },

  getProfitReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = profitQuerySchema.parse(req.query);
      const report = await reportService.getProfitReport(query);
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },

  getCompanyAccountReport: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await reportService.getCompanyAccountReport();
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },

  getCustomerDebtReport: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await reportService.getCustomerDebtReport();
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },

  getCashFlowReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = profitQuerySchema.parse(req.query);
      const report = await reportService.getCashFlowReport(query);
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },

  getExpenseReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = expenseReportQuerySchema.parse(req.query);
      const report = await reportService.getExpenseReport(query);
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },
};
