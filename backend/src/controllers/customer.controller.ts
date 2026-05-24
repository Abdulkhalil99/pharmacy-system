import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { customerService } from '../services/customer.service';
import { sendSuccess } from '../utils/response.helper';

const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().optional(),
});

const customerPaymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  note: z.string().optional(),
  date: z.string().optional(),
});

const customerFiltersSchema = z.object({
  search: z.string().optional(),
});

const getParamValue = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export const customerController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = customerFiltersSchema.parse(req.query);
      const customers = await customerService.getAll(filters);
      sendSuccess(res, customers);
    } catch (err) {
      next(err);
    }
  },

  getDebtors: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = customerFiltersSchema.parse(req.query);
      const customers = await customerService.getDebtors(filters);
      sendSuccess(res, customers);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await customerService.getById(getParamValue(req.params.id));
      sendSuccess(res, customer);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = customerSchema.parse(req.body);
      const customer = await customerService.create(data);
      sendSuccess(res, customer, 'Customer created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = customerSchema.partial().parse(req.body);
      const customer = await customerService.update(getParamValue(req.params.id), data);
      sendSuccess(res, customer, 'Customer updated successfully');
    } catch (err) {
      next(err);
    }
  },

  getTransactions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transactions = await customerService.getTransactions(getParamValue(req.params.id));
      sendSuccess(res, transactions);
    } catch (err) {
      next(err);
    }
  },

  recordPayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = customerPaymentSchema.parse(req.body);
      const result = await customerService.recordPayment(getParamValue(req.params.id), data);
      sendSuccess(res, result, 'Customer payment recorded successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  getReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await customerService.getReport(getParamValue(req.params.id));
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },
};
