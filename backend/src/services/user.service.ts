import bcrypt from 'bcryptjs';
import { Language, Prisma, Role } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../utils/prismaClient';

export type UserLinkStatus = 'ALL' | 'LINKED' | 'UNLINKED';

export interface UserActor {
  userId: string;
  role: Role;
}

export interface UserListFilters {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
  isActive?: boolean;
  linkStatus?: UserLinkStatus;
}

export interface CreateUserInput {
  name: string;
  username: string;
  password: string;
  role: Role;
  phone?: string;
  email?: string;
  language?: Language;
  isActive?: boolean;
}

export interface UpdateUserInput {
  name?: string;
  username?: string;
  role?: Role;
  phone?: string;
  email?: string;
  language?: Language;
  isActive?: boolean;
}

export interface ResetPasswordInput {
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const USERNAME_PATTERN = /^[A-Za-z0-9]+$/;

const userListArgs = Prisma.validator<Prisma.UserDefaultArgs>()({
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
    createdById: true,
    createdBy: {
      select: {
        id: true,
        name: true,
        username: true,
      },
    },
    employee: {
      select: {
        id: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    },
  },
});

const userCredentialArgs = Prisma.validator<Prisma.UserDefaultArgs>()({
  select: {
    id: true,
    name: true,
    username: true,
    password: true,
    role: true,
    phone: true,
    email: true,
    isActive: true,
    language: true,
    lastLogin: true,
    createdAt: true,
    updatedAt: true,
    createdById: true,
  },
});

type UserListRow = Prisma.UserGetPayload<typeof userListArgs>;
type UserCredentialRow = Prisma.UserGetPayload<typeof userCredentialArgs>;

const normalizeOptionalString = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeUsername = (value: string): string => value.trim();

const ensureValidUsername = (username: string) => {
  if (username.length < 3) {
    throw new AppError('Username must be at least 3 characters long', 400);
  }

  if (username.includes(' ')) {
    throw new AppError('Username cannot contain spaces', 400);
  }

  if (!USERNAME_PATTERN.test(username)) {
    throw new AppError('Username can only contain letters and numbers', 400);
  }
};

const ensureStrongPassword = (password: string) => {
  if (password.trim().length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }
};

const buildUserWhere = (filters: UserListFilters): Prisma.UserWhereInput => {
  const search = normalizeOptionalString(filters.search);

  return {
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              username: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {}),
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    ...(filters.linkStatus === 'LINKED'
      ? {
          employee: {
            isNot: null,
          },
        }
      : {}),
    ...(filters.linkStatus === 'UNLINKED'
      ? {
          employee: null,
        }
      : {}),
  };
};

const mapUser = (user: UserListRow) => ({
  id: user.id,
  name: user.name,
  username: user.username,
  role: user.role,
  phone: user.phone,
  email: user.email,
  isActive: user.isActive,
  language: user.language,
  lastLogin: user.lastLogin?.toISOString() ?? null,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
  createdById: user.createdById,
  createdBy: user.createdBy
    ? {
        id: user.createdBy.id,
        name: user.createdBy.name,
        username: user.createdBy.username,
      }
    : null,
  employee: user.employee
    ? {
        id: user.employee.id,
        fullName: user.employee.fullName,
        role: user.employee.role,
        isActive: user.employee.isActive,
      }
    : null,
});

const getUserOrThrow = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    ...userListArgs,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

const getUserWithPasswordOrThrow = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    ...userCredentialArgs,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

const ensureUniqueUsername = async (username: string, excludeId?: string) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      username,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new AppError('Username is already taken', 409);
  }
};

const ensureUniqueEmail = async (email: string | null, excludeId?: string) => {
  if (!email) {
    return;
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new AppError('Email is already in use', 409);
  }
};

const countOtherActiveAdmins = async (userId: string) =>
  prisma.user.count({
    where: {
      role: Role.ADMIN,
      isActive: true,
      id: {
        not: userId,
      },
    },
  });

const ensureActiveAdminRemains = async (
  user: { id: string; role: Role; isActive: boolean },
  nextRole: Role,
  nextIsActive: boolean
) => {
  if (user.role !== Role.ADMIN || !user.isActive) {
    return;
  }

  if (nextRole === Role.ADMIN && nextIsActive) {
    return;
  }

  const otherActiveAdmins = await countOtherActiveAdmins(user.id);

  if (otherActiveAdmins === 0) {
    throw new AppError('At least one active admin must remain in the system', 400);
  }
};

const canManageUser = (actor: UserActor, targetUserId: string) =>
  actor.role === Role.ADMIN || actor.userId === targetUserId;

const prepareUserUpdateData = async (
  existingUser: UserListRow,
  data: UpdateUserInput,
  actor: UserActor
): Promise<Prisma.UserUpdateInput> => {
  const isSelf = actor.userId === existingUser.id;
  const isAdmin = actor.role === Role.ADMIN;
  const requestedKeys = Object.entries(data).filter(([, value]) => value !== undefined);

  if (!requestedKeys.length) {
    throw new AppError('No updates were provided', 400);
  }

  if (!isAdmin && !isSelf) {
    throw new AppError('You are not allowed to update this user', 403);
  }

  if (!isAdmin) {
    const disallowedKeys = requestedKeys
      .map(([key]) => key)
      .filter((key) => key !== 'language');

    if (disallowedKeys.length > 0) {
      throw new AppError('You can only update your language preference', 403);
    }
  }

  const normalizedName = data.name?.trim();
  const normalizedUsername = data.username ? normalizeUsername(data.username) : undefined;
  const normalizedEmail = normalizeOptionalString(data.email);
  const normalizedPhone = normalizeOptionalString(data.phone);
  const nextRole = data.role ?? existingUser.role;
  const nextIsActive = data.isActive ?? existingUser.isActive;

  if (normalizedName !== undefined && !normalizedName) {
    throw new AppError('Name is required', 400);
  }

  if (normalizedUsername !== undefined) {
    ensureValidUsername(normalizedUsername);
    await ensureUniqueUsername(normalizedUsername, existingUser.id);
  }

  await ensureUniqueEmail(normalizedEmail, existingUser.id);

  if (isSelf && isAdmin && (nextRole !== Role.ADMIN || !nextIsActive)) {
    throw new AppError('You cannot remove your own active admin access', 400);
  }

  if (isAdmin) {
    await ensureActiveAdminRemains(existingUser, nextRole, nextIsActive);
  }

  return {
    ...(normalizedName !== undefined ? { name: normalizedName } : {}),
    ...(normalizedUsername !== undefined ? { username: normalizedUsername } : {}),
    ...(data.role !== undefined && isAdmin ? { role: data.role } : {}),
    ...(data.isActive !== undefined && isAdmin ? { isActive: data.isActive } : {}),
    ...(data.language !== undefined ? { language: data.language } : {}),
    ...(data.phone !== undefined && isAdmin ? { phone: normalizedPhone } : {}),
    ...(data.email !== undefined && isAdmin ? { email: normalizedEmail } : {}),
  };
};

export const userService = {
  async getAll(filters: UserListFilters) {
    const page = Math.max(filters.page, 1);
    const limit = Math.min(Math.max(filters.limit, 1), 100);
    const where = buildUserWhere(filters);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isActive: 'desc' }, { role: 'asc' }, { name: 'asc' }],
        ...userListArgs,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(mapUser),
      total,
      page,
      limit,
    };
  },

  async getById(id: string, actor: UserActor) {
    if (!canManageUser(actor, id)) {
      throw new AppError('You are not allowed to view this user', 403);
    }

    const user = await getUserOrThrow(id);
    return mapUser(user);
  },

  async create(data: CreateUserInput, actor: UserActor) {
    if (actor.role !== Role.ADMIN) {
      throw new AppError('Only admins can create users', 403);
    }

    const name = data.name.trim();
    const username = normalizeUsername(data.username);
    const email = normalizeOptionalString(data.email);
    const phone = normalizeOptionalString(data.phone);

    if (!name) {
      throw new AppError('Name is required', 400);
    }

    ensureValidUsername(username);
    ensureStrongPassword(data.password);
    await ensureUniqueUsername(username);
    await ensureUniqueEmail(email);

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: passwordHash,
        role: data.role,
        phone,
        email,
        isActive: data.isActive ?? true,
        language: data.language ?? Language.fa,
        createdById: actor.userId,
      },
      ...userListArgs,
    });

    return mapUser(user);
  },

  async update(id: string, data: UpdateUserInput, actor: UserActor) {
    const existingUser = await getUserOrThrow(id);
    const updateData = await prepareUserUpdateData(existingUser, data, actor);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      ...userListArgs,
    });

    return mapUser(user);
  },

  async softDelete(id: string, actor: UserActor) {
    if (actor.role !== Role.ADMIN) {
      throw new AppError('Only admins can delete users', 403);
    }

    if (actor.userId === id) {
      throw new AppError('You cannot deactivate your own account from this action', 400);
    }

    const existingUser = await getUserOrThrow(id);
    await ensureActiveAdminRemains(existingUser, existingUser.role, false);

    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
      ...userListArgs,
    });

    return mapUser(user);
  },

  async resetPassword(id: string, data: ResetPasswordInput, actor: UserActor) {
    if (actor.role !== Role.ADMIN) {
      throw new AppError('Only admins can reset user passwords', 403);
    }

    if (actor.userId === id) {
      throw new AppError('Use change password for your own password updates', 400);
    }

    if (data.newPassword !== data.confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    ensureStrongPassword(data.newPassword);
    await getUserWithPasswordOrThrow(id);

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

  async changePassword(id: string, data: ChangePasswordInput, actor: UserActor) {
    if (actor.userId !== id) {
      throw new AppError('You can only change your own password', 403);
    }

    if (data.newPassword !== data.confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    ensureStrongPassword(data.newPassword);

    const user = await getUserWithPasswordOrThrow(id);
    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
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
      passwordChangedAt: new Date().toISOString(),
    };
  },

  async toggleActive(id: string, actor: UserActor) {
    if (actor.role !== Role.ADMIN) {
      throw new AppError('Only admins can activate or deactivate users', 403);
    }

    if (actor.userId === id) {
      throw new AppError('You cannot toggle your own active status', 400);
    }

    const existingUser = await getUserOrThrow(id);
    const nextIsActive = !existingUser.isActive;
    await ensureActiveAdminRemains(existingUser, existingUser.role, nextIsActive);

    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive: nextIsActive,
      },
      ...userListArgs,
    });

    return mapUser(user);
  },

  async checkUsernameAvailability(username: string, excludeId?: string) {
    const normalizedUsername = normalizeUsername(username);
    ensureValidUsername(normalizedUsername);

    const existingUser = await prisma.user.findFirst({
      where: {
        username: normalizedUsername,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: {
        id: true,
      },
    });

    return {
      username: normalizedUsername,
      available: !existingUser,
    };
  },
};
