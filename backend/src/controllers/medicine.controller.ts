import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { medicineService } from '../services/medicine.service';
import { sendSuccess, sendPaginated } from '../utils/response.helper';

const medicineSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  kind: z.enum([
    'SYRUP',
    'TABLET',
    'CAPSULE',
    'INJECTION',
    'DROPS',
    'CREAM',
    'OINTMENT',
    'GEL',
    'POWDER',
    'SPRAY',
    'LOTION',
    'SUPPOSITORY',
    'SUSPENSION',
    'SOLUTION',
    'INHALER',
  ]).optional(),
  barcode: z.string().optional(),
  company: z.string().min(1, 'Company is required'),
  buyPrice: z.coerce.number().positive('Buy price must be positive'),
  sellPrice: z.coerce.number().positive('Sell price must be positive'),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative'),
  minQuantity: z.coerce.number().int().min(0),
  expiryDate: z.string().min(1, 'Expiry date is required'),
});

const returnSchema = z.object({
  quantity: z.coerce.number().int().positive('Quantity must be positive'),
  reason: z.string().optional(),
});

const getParamValue = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export const medicineController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, status, page, limit } = req.query;
      const result = await medicineService.getAll({
        search: search as string | undefined,
        status: status as 'all' | 'low_stock' | 'expiring_soon' | 'expired' | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      sendPaginated(res, result.medicines, result.meta.total, result.meta.page, result.meta.limit);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const medicine = await medicineService.getById(getParamValue(req.params.id));
      sendSuccess(res, medicine);
    } catch (err) {
      next(err);
    }
  },

  getLowStock: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const medicines = await medicineService.getLowStock();
      sendSuccess(res, medicines);
    } catch (err) {
      next(err);
    }
  },

  getExpiringSoon: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const medicines = await medicineService.getExpiringSoon(days);
      sendSuccess(res, medicines);
    } catch (err) {
      next(err);
    }
  },

  getSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await medicineService.getSummary();
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = medicineSchema.parse(req.body);
      const medicine = await medicineService.create(data);
      sendSuccess(res, medicine, 'Medicine created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = medicineSchema.partial().parse(req.body);
      const medicine = await medicineService.update(getParamValue(req.params.id), data);
      sendSuccess(res, medicine, 'Medicine updated successfully');
    } catch (err) {
      next(err);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await medicineService.delete(getParamValue(req.params.id));
      sendSuccess(res, null, 'Medicine deleted successfully');
    } catch (err) {
      next(err);
    }
  },

  returnStock: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { quantity, reason } = returnSchema.parse(req.body);
      const medicine = await medicineService.returnStock(
        getParamValue(req.params.id),
        quantity,
        reason
      );
      sendSuccess(res, medicine, `${quantity} units returned to stock`);
    } catch (err) {
      next(err);
    }
  },
};
