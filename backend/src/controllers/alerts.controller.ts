import { NextFunction, Request, Response } from 'express';
import { alertService } from '../services/alert.service';
import { sendSuccess } from '../utils/response.helper';

export const alertsController = {
  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const alerts = await alertService.getCombinedAlerts();
      sendSuccess(res, alerts);
    } catch (err) {
      next(err);
    }
  },
};
