import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { employeeService } from '../services/employee.service';
import { sendSuccess } from '../utils/response.helper';

const employeeFiltersSchema = z.object({
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

const employeeSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
  role: z.string().min(1, 'Role is required'),
  salary: z.coerce.number().min(0, 'Salary cannot be negative'),
  joinDate: z.string().min(1, 'Join date is required'),
  isActive: z.boolean().optional(),
});

const updateEmployeeSchema = employeeSchema.partial();

const linkUserSchema = z.object({
  userId: z.string().min(1, 'User is required'),
});

const getParamValue = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

const parseActiveFilter = (value?: 'true' | 'false') => {
  if (value === undefined) {
    return undefined;
  }

  return value === 'true';
};

export const employeeController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = employeeFiltersSchema.parse(req.query);
      const employees = await employeeService.getAll({
        search: filters.search,
        isActive: parseActiveFilter(filters.isActive),
      });
      sendSuccess(res, employees);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employee = await employeeService.getById(getParamValue(req.params.id));
      sendSuccess(res, employee);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = employeeSchema.parse(req.body);
      const employee = await employeeService.create(data);
      sendSuccess(res, employee, 'Employee created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateEmployeeSchema.parse(req.body);
      const employee = await employeeService.update(getParamValue(req.params.id), data);
      sendSuccess(res, employee, 'Employee updated successfully');
    } catch (err) {
      next(err);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employee = await employeeService.softDelete(getParamValue(req.params.id));
      sendSuccess(res, employee, 'Employee deactivated successfully');
    } catch (err) {
      next(err);
    }
  },

  linkUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = linkUserSchema.parse(req.body);
      const employee = await employeeService.linkUser(getParamValue(req.params.id), data.userId);
      sendSuccess(res, employee, 'User account linked successfully');
    } catch (err) {
      next(err);
    }
  },

  getSalaryHistory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const history = await employeeService.getSalaryHistory(getParamValue(req.params.id));
      sendSuccess(res, history);
    } catch (err) {
      next(err);
    }
  },
};
