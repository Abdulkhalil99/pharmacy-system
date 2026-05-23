import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// Custom error class so we can throw errors with HTTP status codes
// Usage: throw new AppError('Medicine not found', 404)
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── 404 Handler ─────────────────────────────────────────────────────────────
// Place this AFTER all your routes. Any request that didn't match a route
// falls through to here.
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// ─── Global Error Handler ────────────────────────────────────────────────────
// MUST have 4 parameters — Express identifies error handlers by arity.
// Call with: next(error) from any route or middleware.
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  // 1. Our own AppError — safe to show message to client
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // 2. Zod validation errors — parse them into readable field errors
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  // 3. Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 = Unique constraint violation (e.g. duplicate username)
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') ?? 'field';
      res.status(409).json({
        success: false,
        message: `A record with this ${field} already exists.`,
      });
      return;
    }

    // P2025 = Record not found (e.g. delete non-existent medicine)
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Record not found.',
      });
      return;
    }

    // P2003 = Foreign key constraint failed
    if (err.code === 'P2003') {
      res.status(400).json({
        success: false,
        message: 'Related record does not exist.',
      });
      return;
    }
  }

  // 4. Prisma validation error (bad data shape sent to Prisma)
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: 'Invalid data provided to database.',
    });
    return;
  }

  // 5. Unknown error — don't leak internals in production
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    success: false,
    message: isDev ? err.message : 'Internal server error.',
    ...(isDev && { stack: err.stack }),
  });
};
