import bcrypt from 'bcryptjs';
import { Language, Prisma, Role } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../utils/prismaClient';

type SafeUser = {
  id: string;
  name: string;
  username: string;
  role: Role;
  language: Language;
  createdAt: string;
};

export interface CreateUserInput {
  name: string;
  username: string;
  password: string;
  role: Role;
  language?: Language;
}

export interface UpdateUserInput {
  name?: string;
  username?: string;
  role?: Role;
  language?: Language;
}

export interface ResetPasswordInput {
  newPassword: string;
}

const userSelect = Prisma.validator<Prisma.UserDefaultArgs>()({
  select: {
    id: true,
    name: true,
    username: true,
    role: true,
    language: true,
    createdAt: true,
  },
});

const mapUser = (
  user: Prisma.UserGetPayload<typeof userSelect>
): SafeUser => ({
  id: user.id,
  name: user.name,
  username: user.username,
  role: user.role,
  language: user.language,
  createdAt: user.createdAt.toISOString(),
});

const getUserOrThrow = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    ...userSelect,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

const ensureStrongPassword = (password: string) => {
  if (password.trim().length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }
};

const countAdmins = async () =>
  prisma.user.count({
    where: {
      role: Role.ADMIN,
    },
  });

export const userService = {
  async getAll() {
    const users = await prisma.user.findMany({
      ...userSelect,
      orderBy: [{ role: 'asc' }, { name: 'asc' }, { username: 'asc' }],
    });

    return users.map(mapUser);
  },

  async create(data: CreateUserInput) {
    const name = data.name.trim();
    const username = data.username.trim();
    ensureStrongPassword(data.password);

    if (!name) {
      throw new AppError('Name is required', 400);
    }

    if (!username) {
      throw new AppError('Username is required', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role: data.role,
        language: data.language ?? Language.fa,
      },
      ...userSelect,
    });

    return mapUser(user);
  },

  async update(id: string, data: UpdateUserInput, actorUserId?: string) {
    const existingUser = await getUserOrThrow(id);
    const nextRole = data.role ?? existingUser.role;

    if (actorUserId && actorUserId === id && existingUser.role === Role.ADMIN && nextRole !== Role.ADMIN) {
      throw new AppError('You cannot remove your own admin access', 400);
    }

    if (existingUser.role === Role.ADMIN && nextRole !== Role.ADMIN) {
      const adminCount = await countAdmins();

      if (adminCount <= 1) {
        throw new AppError('At least one admin user must remain in the system', 400);
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.username !== undefined ? { username: data.username.trim() } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.language !== undefined ? { language: data.language } : {}),
      },
      ...userSelect,
    });

    return mapUser(user);
  },

  async remove(id: string, actorUserId?: string) {
    const existingUser = await getUserOrThrow(id);

    if (actorUserId && actorUserId === id) {
      throw new AppError('You cannot delete your own account', 400);
    }

    if (existingUser.role === Role.ADMIN) {
      const adminCount = await countAdmins();

      if (adminCount <= 1) {
        throw new AppError('You cannot delete the last admin user', 400);
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    return {
      id,
      deletedAt: new Date().toISOString(),
    };
  },

  async resetPassword(id: string, data: ResetPasswordInput, actorUserId?: string) {
    await getUserOrThrow(id);
    ensureStrongPassword(data.newPassword);

    if (actorUserId && actorUserId === id) {
      throw new AppError('Use change password for your own account password updates', 400);
    }

    const password = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
      where: { id },
      data: {
        password,
      },
    });

    return {
      id,
      passwordResetAt: new Date().toISOString(),
    };
  },
};
