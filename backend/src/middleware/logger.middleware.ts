import { Request, Response, NextFunction } from 'express';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const getStatusColor = (status: number): string => {
  if (status >= 500) return colors.red;
  if (status >= 400) return colors.yellow;
  if (status >= 300) return colors.cyan;
  return colors.green;
};

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = getStatusColor(res.statusCode);

    console.log(
      `${colors.gray}[${timestamp}]${colors.reset} ` +
        `${colors.cyan}${req.method}${colors.reset} ` +
        `${req.originalUrl} ` +
        `${statusColor}${res.statusCode}${colors.reset} ` +
        `${colors.gray}${duration}ms${colors.reset}`
    );
  });

  next();
};