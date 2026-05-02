import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { ConflictError, UnauthorizedError } from '../lib/errors.js';
import { createSessionTokens, hashToken, verifyRefresh } from '../lib/jwt.js';

export const safeUserSelect = {
  id: true,
  email: true,
  displayName: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
};

function defaultAvatarUrl(seed) {
  const safe = encodeURIComponent((seed || 'user').trim() || 'user');
  return `https://api.dicebear.com/7.x/initials/svg?seed=${safe}&backgroundType=gradientLinear&fontWeight=600`;
}

function refreshTokenExpiryDate() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

async function persistRefreshToken(userId, refreshToken) {
  return prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiryDate(),
    },
  });
}

export async function register({ email, password, displayName }) {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError('Email is already registered');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
      avatarUrl: defaultAvatarUrl(displayName || email),
    },
    select: safeUserSelect,
  });

  const tokens = createSessionTokens(user.id);
  await persistRefreshToken(user.id, tokens.refreshToken);

  return { user, ...tokens };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const matches = await bcrypt.compare(password, user.passwordHash);

  if (!matches) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const tokens = createSessionTokens(user.id);
  await persistRefreshToken(user.id, tokens.refreshToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    ...tokens,
  };
}

export async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token missing');
  }

  let payload;

  try {
    payload = verifyRefresh(refreshToken);
  } catch {
    throw new UnauthorizedError('Refresh token is invalid');
  }

  const tokenHash = hashToken(refreshToken);

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      revokedAt: true,
      expiresAt: true,
      userId: true,
      user: {
        select: safeUserSelect,
      },
    },
  });

  if (!record || record.revokedAt || record.expiresAt <= new Date()) {
    throw new UnauthorizedError('Refresh token is invalid');
  }

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const tokens = createSessionTokens(payload.sub);
  await persistRefreshToken(payload.sub, tokens.refreshToken);

  return {
    user: record.user,
    ...tokens,
  };
}

export async function logout(refreshToken) {
  if (!refreshToken) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken) },
    data: { revokedAt: new Date() },
  });
}

export async function getCurrentUser(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  });
}
