import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
    language: string;
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

    // 3. Compare submitted password against the stored bcrypt hash
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw INVALID_CREDENTIALS;

    // 4. Sign a JWT — the secret signs it so we can verify it wasn't tampered with
    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role } as TokenPayload,
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        language: user.language,
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
        language: true,
        createdAt: true,
      },
    });

    if (!user) throw new AppError('User not found', 404);
    return user;
  },

  // ─── Change Password ──────────────────────────────────────────────────────
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

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