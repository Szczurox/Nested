import { randomBytes } from "node:crypto";

import argon2 from "argon2";
import type { Prisma, PrismaClient } from "@prisma/client";
import { MemberPermission, ParticipantPermission } from "@prisma/client";
import type { FastifyRequest } from "fastify";

import { config } from "./config.js";
import { prisma } from "./db.js";

export const usernamePattern = /^[a-zA-Z0-9_]{2,32}$/;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function createSessionExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + config.SESSION_TTL_DAYS);
  return expiry;
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(
  passwordHash: string,
  password: string
): Promise<boolean> {
  return argon2.verify(passwordHash, password);
}

export async function createSession(
  userId: string,
  database: PrismaClient | Prisma.TransactionClient = prisma
): Promise<{
  id: string;
  expiresAt: Date;
}> {
  const session = {
    id: randomBytes(32).toString("hex"),
    userId,
    expiresAt: createSessionExpiry(),
  };

  await database.session.create({ data: session });
  return { id: session.id, expiresAt: session.expiresAt };
}

export function setSessionCookie(
  reply: { setCookie: (name: string, value: string, options: object) => unknown },
  session: { id: string; expiresAt: Date }
): void {
  reply.setCookie(config.SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.SESSION_COOKIE_SECURE ?? config.NODE_ENV === "production",
    path: "/",
    expires: session.expiresAt,
  });
}

export function clearSessionCookie(reply: {
  clearCookie: (name: string, options: object) => unknown;
}): void {
  reply.clearCookie(config.SESSION_COOKIE_NAME, { path: "/" });
}

export async function getAuthenticatedUser(request: FastifyRequest) {
  const sessionId = request.cookies[config.SESSION_COOKIE_NAME];
  return getAuthenticatedUserBySessionId(sessionId);
}

export async function getAuthenticatedUserBySessionId(sessionId: string | undefined) {
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  return session.user;
}

export function publicUser(user: {
  id: string;
  username: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function requireGroupMember(
  request: FastifyRequest,
  groupId: string
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { user: null, member: null };
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });
  return { user, member };
}

export function hasMemberPermission(
  permissions: MemberPermission[],
  permission: MemberPermission
): boolean {
  return permissions.includes(permission);
}

export function hasParticipantPermission(
  permissions: ParticipantPermission[],
  permission: ParticipantPermission
): boolean {
  return permissions.includes(permission);
}
