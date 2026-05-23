import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

// Extend Express's Request type so TypeScript knows req.user exists
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        role: Role;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  username: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ─── Verify Token ───────────────────────────────────────────────────────────
// This runs on every protected route.
// It reads the Authorization header, verifies the JWT, and attaches
// the decoded payload to req.user for use in controllers.
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Token malformed.',
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // verify() throws if:
    // - the token signature doesn't match (tampered)
    // - the token is expired (exp < now)
    // - the token is malformed
    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
      return;
    }

    // Unexpected error (e.g. missing JWT_SECRET)
    res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

// ─── Role Guard ─────────────────────────────────────────────────────────────
// Usage: router.delete('/users/:id', authenticate, requireRole('ADMIN'), handler)
// Pass one or more roles that are allowed to access the route.
// ADMIN always passes — they can do everything.
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
      return;
    }

    // ADMIN bypasses all role checks
    if (req.user.role === Role.ADMIN) {
      next();
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
      });
      return;
    }

    next();
  };
};

// ─── Convenience Guards (use these in routes for clarity) ───────────────────
export const adminOnly = requireRole(Role.ADMIN);
export const pharmacistOrAdmin = requireRole(Role.PHARMACIST, Role.ADMIN);
export const cashierOrAdmin = requireRole(Role.CASHIER, Role.ADMIN);
export const anyRole = requireRole(Role.ADMIN, Role.PHARMACIST, Role.CASHIER);