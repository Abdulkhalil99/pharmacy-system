import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import { prisma } from '../utils/prismaClient';
import { AppError } from '../middleware/error.middleware';
import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  username: string;
  role: Role;
}

export interface LoginResult {
  user: {
    id: string;
    name: string;
    username: string;
    role: Role;
    phone: string | null;
    email: string | null;
    isActive: boolean;
    language: string;
    lastLogin: string | null;
  };
  token: string;
}

export const authService = {
  // ─── Login ────────────────────────────────────────────────────────────────
  async login(username: string, password: string): Promise<LoginResult> {
    // 1. Find user by username
    const user = await prisma.user.findUnique({ where: { username } });

    // 2. Use the same error for "user not found" and "wrong password"
    //    This prevents attackers from knowing which one failed (user enumeration)
    const INVALID_CREDENTIALS = new AppError('Invalid username or password', 401);

    if (!user) throw INVALID_CREDENTIALS;

    if (!user.isActive) {
      throw new AppError('This account is inactive. Please contact an administrator.', 403);
    }

    // 3. Compare submitted password against the stored bcrypt hash
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw INVALID_CREDENTIALS;

    // 4. Sign a JWT — the secret signs it so we can verify it wasn't tampered with
    const secret = process.env.JWT_SECRET as Secret;
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
    const token = jwt.sign(
      payload,
      secret,
      { expiresIn }
    );

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLogin: new Date(),
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        phone: true,
        email: true,
        isActive: true,
        language: true,
        lastLogin: true,
      },
    });

    return {
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        role: updatedUser.role,
        phone: updatedUser.phone,
        email: updatedUser.email,
        isActive: updatedUser.isActive,
        language: updatedUser.language,
        lastLogin: updatedUser.lastLogin?.toISOString() ?? null,
      },
      token,
    };
  },

  // ─── Get Current User ─────────────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        phone: true,
        email: true,
        isActive: true,
        language: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new AppError('User not found', 404);
    return user;
  },

  // ─── Change Password ──────────────────────────────────────────────────────
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    if (!user.isActive) {
      throw new AppError('Inactive users cannot change password', 403);
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new AppError('Current password is incorrect', 400);

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
  },
};
