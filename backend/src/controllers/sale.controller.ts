import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/error.middleware';
import { saleService } from '../services/sale.service';
import { sendSuccess } from '../utils/response.helper';

const prescriptionItemSchema = z.object({
  medicineId: z.string().min(1, 'Medicine is required'),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
});

const createPrescriptionSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, 'At least one medicine is required'),
  paidAmount: z.coerce.number().min(0, 'Paid amount cannot be negative'),
});

const returnMedicineSchema = z.object({
  prescriptionItemId: z.string().min(1, 'Prescription item is required'),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  reason: z.string().optional(),
});

const getParamValue = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export const saleController = {
  createPrescription: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createPrescriptionSchema.parse(req.body);
      const receipt = await saleService.createPrescriptionSale(data);
      sendSuccess(res, receipt, 'Prescription sale created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sales = await saleService.getAll({
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      });
      sendSuccess(res, sales);
    } catch (err) {
      next(err);
    }
  },

  getDailySummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await saleService.getPeriodSummary('daily');
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  },

  getWeeklySummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await saleService.getPeriodSummary('weekly');
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  },

  getMonthlySummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await saleService.getPeriodSummary('monthly');
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  },

  getYearlySummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await saleService.getPeriodSummary('yearly');
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sale = await saleService.getById(getParamValue(req.params.id));
      sendSuccess(res, sale);
    } catch (err) {
      next(err);
    }
  },

  returnMedicine: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = returnMedicineSchema.parse(req.body);

      if (!req.user?.userId) {
        throw new AppError('Not authenticated.', 401);
      }

      const result = await saleService.returnMedicine({
        ...data,
        userId: req.user.userId,
      });

      sendSuccess(res, result, 'Medicine return recorded successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  searchCustomers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customers = await saleService.searchCustomers(
        req.query.q as string | undefined,
        req.query.limit ? Number(req.query.limit) : 10
      );
      sendSuccess(res, customers);
    } catch (err) {
      next(err);
    }
  },
};
