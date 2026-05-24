import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { companyService } from '../services/company.service';
import { sendSuccess } from '../utils/response.helper';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const purchaseItemSchema = z.object({
  medicineId: z.string().optional(),
  name: z.string().min(1, 'Medicine name is required'),
  barcode: z.string().optional(),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  buyPrice: z.coerce.number().positive('Buy price must be greater than 0'),
  sellPrice: z.coerce.number().positive('Sell price must be greater than 0'),
  minQuantity: z.coerce.number().int().min(0).optional(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
});

const purchaseSchema = z.object({
  billNumber: z.string().optional(),
  note: z.string().optional(),
  date: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'At least one medicine item is required'),
});

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  note: z.string().optional(),
  date: z.string().optional(),
});

const getParamValue = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export const companyController = {
  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const companies = await companyService.getAll();
      sendSuccess(res, companies);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const company = await companyService.getById(getParamValue(req.params.id));
      sendSuccess(res, company);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = companySchema.parse(req.body);
      const company = await companyService.create(data);
      sendSuccess(res, company, 'Company created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = companySchema.partial().parse(req.body);
      const company = await companyService.update(getParamValue(req.params.id), data);
      sendSuccess(res, company, 'Company updated successfully');
    } catch (err) {
      next(err);
    }
  },

  getTransactions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transactions = await companyService.getTransactions(getParamValue(req.params.id));
      sendSuccess(res, transactions);
    } catch (err) {
      next(err);
    }
  },

  recordPurchase: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = purchaseSchema.parse(req.body);
      const result = await companyService.recordPurchase(getParamValue(req.params.id), data);
      sendSuccess(res, result, 'Purchase recorded successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  recordPayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = paymentSchema.parse(req.body);
      const result = await companyService.recordPayment(getParamValue(req.params.id), data);
      sendSuccess(res, result, 'Payment recorded successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  getReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await companyService.getReport(getParamValue(req.params.id));
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },
};
