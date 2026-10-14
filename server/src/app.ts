import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import sensible from "@fastify/sensible";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { z } from "zod";
import {
  ChannelType,
  MemberPermission,
  ParticipantPermission,
} from "@prisma/client";

import {
  clearSessionCookie,
  createSession,
  getAuthenticatedUser,
  hashPassword,
  normalizeUsername,
  publicUser,
  hasMemberPermission,
  requireGroupMember,
  setSessionCookie,
  usernamePattern,
  verifyPassword,
} from "./auth.js";
import { config } from "./config.js";
import { prisma } from "./db.js";
import {
  publishMessage,
  publishMessageDeleted,
  publishMessageUpdated,
  publishGroupNavigation,
} from "./realtime.js";

const credentialsSchema = z.object({
  username: z.string().trim().regex(usernamePattern, "Username must be 2-32 characters and contain only letters, numbers, or underscores"),
  password: z.string().min(8).max(128),
});

const profileUpdateSchema = z
  .object({
    username: z
      .string()
      .trim()
      .regex(
        usernamePattern,
        "Username must be 2-32 characters and contain only letters, numbers, or underscores"
      )
      .optional(),
    nickname: z.string().trim().min(2).max(32).optional(),
  })
  .refine((value) => value.username !== undefined || value.nickname !== undefined, {
    message: "At least one profile field is required",
  });

const groupSchema = z.object({ name: z.string().trim().min(1).max(80) });
const inviteSchema = z.object({ expiresAt: z.string().datetime().optional() });
const categorySchema = z.object({ name: z.string().trim().min(1).max(80) });
const channelSchema = z.object({
  name: z.string().trim().min(1).max(80),
  categoryId: z.string().cuid().nullable().optional(),
  type: z.nativeEnum(ChannelType).default(ChannelType.TEXT),
});
const memberUpdateSchema = z.object({
  nickname: z.string().trim().min(1).max(32).optional(),
  nameColor: z.string().max(32).optional(),
  permissions: z.array(z.nativeEnum(MemberPermission)).optional(),
});
const messageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  file: z.string().url().max(2048).optional(),
  fileType: z.string().max(80).optional(),
  emojiBucket: z.array(z.string().max(2048)).max(50).default([]),
});
const participantUpdateSchema = z.object({
  permissions: z.array(z.nativeEnum(ParticipantPermission)).optional(),
  nickname: z.string().trim().min(1).max(32).nullable().optional(),
  avatarUrl: z.string().url().max(2048).nullable().optional(),
});
const emojiSchema = z.object({ name: z.string().trim().regex(/^[a-zA-Z0-9_-]{1,32}$/) });

const imageTypes = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
const mediaTypes = new Set([...imageTypes, "video/mp4", "video/webm", "video/quicktime"]);
const safeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

async function storeUpload(file: Awaited<ReturnType<FastifyRequest["file"]>>, folder: string, maxSize: number) {
  if (!file) throw new Error("FILE_REQUIRED");
  if (file.file.truncated) throw new Error("FILE_TOO_LARGE");
  const buffer = await file.toBuffer();
  if (buffer.byteLength > maxSize) throw new Error("FILE_TOO_LARGE");
  const extension = path.extname(safeFileName(file.filename)).toLowerCase();
  const fileName = `${crypto.randomUUID()}${extension}`;
  const relativePath = path.join(folder, fileName);
  const absolutePath = path.resolve(config.STORAGE_DIR, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await (await import("node:fs/promises")).writeFile(absolutePath, buffer);
  return {
    url: `${config.PUBLIC_URL}/uploads/${relativePath.replaceAll(path.sep, "/")}`,
    contentType: file.mimetype,
  };
}

async function requireChannelAccess(request: FastifyRequest, channelId: string) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { user: null, channel: null, member: null, participant: null };
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) return { user, channel: null, member: null, participant: null };
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: channel.groupId, userId: user.id } },
  });
  const participant = await prisma.channelParticipant.findUnique({
    where: { channelId_userId: { channelId, userId: user.id } },
  });
  return { user, channel, member, participant };
}

export function buildApp(options: { logger?: boolean } = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false });

  app.register(cookie);
  app.register(multipart, { limits: { fileSize: 8 * 1024 * 1024, files: 1 } });
  app.register(cors, {
    origin: config.WEB_ORIGIN,
    credentials: true,
  });
  app.get("/uploads/*", async (request, reply) => {
    const wildcard = (request.params as { "*": string })["*"];
    const root = path.resolve(config.STORAGE_DIR);
    const filePath = path.resolve(root, wildcard);
    if (!filePath.startsWith(`${root}${path.sep}`)) return reply.code(400).send({ error: "INVALID_FILE_PATH" });
    try {
      const data = await readFile(filePath);
      const contentTypes: Record<string, string> = {
        ".gif": "image/gif",
        ".jpeg": "image/jpeg",
        ".jpg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
      };
      return reply.type(contentTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream").send(data);
    } catch {
      return reply.code(404).send({ error: "FILE_NOT_FOUND" });
    }
  });
  app.register(sensible);

  app.get("/health", async () => ({ status: "ok" }));

  app.post("/api/auth/register", async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "INVALID_CREDENTIALS",
        message: parsed.error.issues[0]?.message ?? "Invalid credentials",
      });
    }

    const username = parsed.data.username.trim();
    const normalizedUsername = normalizeUsername(username);
    const passwordHash = await hashPassword(parsed.data.password);

    try {
      const result = await prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            username,
            normalizedUsername,
            passwordHash,
            nickname: username,
          },
        });
        const session = await createSession(user.id, transaction);
        return { user, session };
      });
      setSessionCookie(reply, result.session);
      return reply.code(201).send({ user: publicUser(result.user) });
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        return reply.code(409).send({
          error: "USERNAME_TAKEN",
          message: "That username is already in use",
        });
      }
      throw error;
    }
  });

  app.post("/api/auth/login", async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "INVALID_CREDENTIALS",
        message: "Username or password is invalid",
      });
    }

    const user = await prisma.user.findUnique({
      where: { normalizedUsername: normalizeUsername(parsed.data.username) },
    });
    if (!user || !(await verifyPassword(user.passwordHash, parsed.data.password))) {
      return reply.code(401).send({
        error: "INVALID_LOGIN",
        message: "Username or password is invalid",
      });
    }

    const session = await createSession(user.id);
    setSessionCookie(reply, session);
    return reply.send({ user: publicUser(user) });
  });

  app.post("/api/auth/logout", async (request, reply) => {
    const sessionId = request.cookies[config.SESSION_COOKIE_NAME];
    if (sessionId) {
      await prisma.session.deleteMany({ where: { id: sessionId } });
    }
    clearSessionCookie(reply);
    return reply.code(204).send();
  });

  app.get("/api/auth/me", async (request, reply) => {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return reply.code(401).send({
        error: "UNAUTHENTICATED",
        message: "Authentication is required",
      });
    }
    return reply.send({ user: publicUser(user) });
  });

  app.get("/api/profile", async (request, reply) => {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return reply.code(401).send({
        error: "UNAUTHENTICATED",
        message: "Authentication is required",
      });
    }
    return reply.send({ user: publicUser(user) });
  });

      app.post("/api/groups", async (request, reply) => {
        const user = await getAuthenticatedUser(request);
        if (!user) {
          return reply.code(401).send({ error: "UNAUTHENTICATED" });
        }
        const parsed = groupSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.code(400).send({ error: "INVALID_GROUP", message: parsed.error.issues[0]?.message });
        }

        const group = await prisma.$transaction(async (transaction) => {
          const created = await transaction.group.create({
            data: { name: parsed.data.name, creatorId: user.id },
          });
          await transaction.groupMember.create({
            data: {
              groupId: created.id,
              userId: user.id,
              nickname: user.nickname,
              avatarUrl: user.avatarUrl,
              permissions: Object.values(MemberPermission),
            },
          });
          return created;
        });
        return reply.code(201).send({ group });
      });

      app.get("/api/groups", async (request, reply) => {
        const user = await getAuthenticatedUser(request);
        if (!user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
        const memberships = await prisma.groupMember.findMany({
          where: { userId: user.id },
          include: { group: true },
          orderBy: { joinedAt: "asc" },
        });
        return reply.send({
          groups: memberships.map(({ group, permissions, nickname, lastViewedChannelId }) => ({
            ...group,
            permissions,
            nickname,
            lastViewedChannelId,
          })),
        });
      });

      app.get("/api/groups/:groupId", async (request, reply) => {
        const { groupId } = request.params as { groupId: string };
        const access = await requireGroupMember(request, groupId);
        if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
        if (!access.member) return reply.code(403).send({ error: "FORBIDDEN" });
        const group = await prisma.group.findUnique({
          where: { id: groupId },
          include: {
            categories: { orderBy: { createdAt: "asc" } },
            channels: { orderBy: { order: "asc" } },
          },
        });
        if (!group) return reply.code(404).send({ error: "GROUP_NOT_FOUND" });
        const member = access.member.permissions.length
          ? access.member
          : {
              ...access.member,
              permissions: [
                MemberPermission.VIEW_CHANNEL,
                MemberPermission.SEND_MESSAGES,
              ],
            };
        return reply.send({ group, member });
      });

      app.post("/api/groups/:groupId/icon", async (request, reply) => {
        const { groupId } = request.params as { groupId: string };
        const access = await requireGroupMember(request, groupId);
        if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
        if (!access.member || !hasMemberPermission(access.member.permissions, MemberPermission.MANAGE_CHANNELS)) {
          return reply.code(403).send({ error: "FORBIDDEN" });
        }
        const file = await request.file();
        if (!file || !imageTypes.has(file.mimetype)) {
          return reply.code(400).send({ error: "INVALID_IMAGE" });
        }
        try {
          const upload = await storeUpload(file, `groups/${groupId}`, 2 * 1024 * 1024);
          const group = await prisma.group.update({
            where: { id: groupId },
            data: { icon: upload.url },
          });
          return reply.send({ group });
        } catch (error) {
          if (error instanceof Error && error.message === "FILE_TOO_LARGE") {
            return reply.code(413).send({ error: "FILE_TOO_LARGE" });
          }
          throw error;
        }
      });

      app.get("/api/groups/:groupId/members", async (request, reply) => {
        const { groupId } = request.params as { groupId: string };
        const access = await requireGroupMember(request, groupId);
        if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
        if (!access.member) return reply.code(403).send({ error: "FORBIDDEN" });
        const members = await prisma.groupMember.findMany({
          where: { groupId },
          orderBy: { nickname: "asc" },
          include: { user: { select: { avatarUrl: true, nickname: true } } },
        });
        return reply.send({
          members: members.map(({ user, ...member }) => ({
            ...member,
            avatarUrl: member.avatarUrl ?? user.avatarUrl,
            profileNickname: user.nickname,
          })),
        });
      });

      app.patch("/api/groups/:groupId/members/:userId", async (request, reply) => {
        const { groupId, userId } = request.params as { groupId: string; userId: string };
        const access = await requireGroupMember(request, groupId);
        if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
        if (!access.member || !hasMemberPermission(access.member.permissions, MemberPermission.MANAGE_CHANNELS)) {
          return reply.code(403).send({ error: "FORBIDDEN" });
        }
        const parsed = memberUpdateSchema.safeParse(request.body);
        if (!parsed.success) return reply.code(400).send({ error: "INVALID_MEMBER" });
        const member = await prisma.groupMember.update({
          where: { groupId_userId: { groupId, userId } },
          data: parsed.data,
        });
        return reply.send({ member });
      });

      app.post("/api/groups/:groupId/invites", async (request, reply) => {
        const { groupId } = request.params as { groupId: string };
        const access = await requireGroupMember(request, groupId);
        if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
        if (!access.member || !hasMemberPermission(access.member.permissions, MemberPermission.MANAGE_CHANNELS)) {
          return reply.code(403).send({ error: "FORBIDDEN" });
        }
        const parsed = inviteSchema.safeParse(request.body ?? {});
        if (!parsed.success) return reply.code(400).send({ error: "INVALID_INVITE" });
        const invite = await prisma.invite.create({
          data: {
            groupId,
            expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
          },
        });
        return reply.code(201).send({ invite });
      });

      app.post("/api/groups/:groupId/invites/:inviteId/accept", async (request, reply) => {
        const user = await getAuthenticatedUser(request);
        if (!user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
        const { groupId, inviteId } = request.params as { groupId: string; inviteId: string };
        const result = await prisma.$transaction(async (transaction) => {
          const invite = await transaction.invite.findFirst({
            where: { id: inviteId, groupId, revokedAt: null },
          });
          if (!invite || (invite.expiresAt && invite.expiresAt <= new Date())) return null;
          const member = await transaction.groupMember.upsert({
            where: { groupId_userId: { groupId, userId: user.id } },
            update: {
              permissions: [
                MemberPermission.VIEW_CHANNEL,
                MemberPermission.SEND_MESSAGES,
              ],
            },
            create: {
              groupId,
              userId: user.id,
              nickname: user.nickname,
              avatarUrl: user.avatarUrl,
              permissions: [
                MemberPermission.VIEW_CHANNEL,
                MemberPermission.SEND_MESSAGES,
              ],
              inviteId,
            },
          });
          return member;
        });
        if (!result) return reply.code(404).send({ error: "INVITE_NOT_FOUND" });
        return reply.send({ member: result });
      });

      app.post("/api/groups/:groupId/categories", async (request, reply) => {
        const { groupId } = request.params as { groupId: string };
        const access = await requireGroupMember(request, groupId);
        if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
        if (!access.member || !hasMemberPermission(access.member.permissions, MemberPermission.MANAGE_CHANNELS)) {
          return reply.code(403).send({ error: "FORBIDDEN" });
        }
        const parsed = categorySchema.safeParse(request.body);
        if (!parsed.success) return reply.code(400).send({ error: "INVALID_CATEGORY" });
        const category = await prisma.category.create({ data: { groupId, name: parsed.data.name } });
        publishGroupNavigation("category.created", groupId, { category });
        return reply.code(201).send({ category });
      });

      app.get("/api/groups/:groupId/categories", async (request, reply) => {
        const { groupId } = request.params as { groupId: string };
        const access = await requireGroupMember(request, groupId);
        if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
        if (!access.member) return reply.code(403).send({ error: "FORBIDDEN" });
        const categories = await prisma.category.findMany({
          where: { groupId },
          include: { channels: { orderBy: { order: "asc" } } },
          orderBy: { createdAt: "asc" },
        });
        return reply.send({ categories });
      });

      app.patch("/api/groups/:groupId/categories/:categoryId", async (request, reply) => {
        const { groupId, categoryId } = request.params as { groupId: string; categoryId: string };
        const access = await requireGroupMember(request, groupId);
        if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
        if (!access.member || !hasMemberPermission(access.member.permissions, MemberPermission.MANAGE_CHANNELS)) {
          return reply.code(403).send({ error: "FORBIDDEN" });
        }
        const parsed = categorySchema.safeParse(request.body);
        if (!parsed.success) return reply.code(400).send({ error: "INVALID_CATEGORY" });
        const category = await prisma.category.updateMany({
          where: { id: categoryId, groupId },
          data: { name: parsed.data.name },
        });
        if (category.count === 0) return reply.code(404).send({ error: "CATEGORY_NOT_FOUND" });
        const updatedCategory = await prisma.category.findUnique({ where: { id: categoryId } });
        publishGroupNavigation("category.updated", groupId, { category: updatedCategory });
        return reply.send({ category: updatedCategory });
      });

      app.delete("/api/groups/:groupId/categories/:categoryId", async (request, reply) => {
        const { groupId, categoryId } = request.params as { groupId: string; categoryId: string };
        const access = await requireGroupMember(request, groupId);
        if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
        if (!access.member || !hasMemberPermission(access.member.permissions, MemberPermission.MANAGE_CHANNELS)) {
          return reply.code(403).send({ error: "FORBIDDEN" });
        }
        const result = await prisma.$transaction(async (transaction) => {
          const category = await transaction.category.findFirst({ where: { id: categoryId, groupId } });
          if (!category) return false;
          await transaction.channel.updateMany({
            where: { categoryId },
            data: { categoryId: null },
          });
          await transaction.category.delete({ where: { id: categoryId } });
          return true;
        });
        if (!result) return reply.code(404).send({ error: "CATEGORY_NOT_FOUND" });
        publishGroupNavigation("category.deleted", groupId, { categoryId });
        return reply.code(204).send();
      });

      app.post("/api/groups/:groupId/channels", async (request, reply) => {
        const { groupId } = request.params as { groupId: string };
        const access = await requireGroupMember(request, groupId);
        if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
        if (!access.member || !hasMemberPermission(access.member.permissions, MemberPermission.MANAGE_CHANNELS)) {
          return reply.code(403).send({ error: "FORBIDDEN" });
        }
        const parsed = channelSchema.safeParse(request.body);
        if (!parsed.success) return reply.code(400).send({ error: "INVALID_CHANNEL" });
        if (parsed.data.categoryId) {
          const category = await prisma.category.findFirst({ where: { id: parsed.data.categoryId, groupId } });
          if (!category) return reply.code(400).send({ error: "INVALID_CATEGORY" });
        }
        const lastChannel = await prisma.channel.findFirst({ where: { groupId }, orderBy: { order: "desc" } });
        const channel = await prisma.$transaction(async (transaction) => {
          const created = await transaction.channel.create({
            data: {
              groupId,
              name: parsed.data.name,
              categoryId: parsed.data.categoryId,
              type: parsed.data.type,
              order: (lastChannel?.order ?? -1) + 1,
            },
          });
          await transaction.channelParticipant.create({
            data: {
              channelId: created.id,
              userId: access.user!.id,
              permissions: Object.values(ParticipantPermission),
              nickname: access.member!.nickname,
              avatarUrl: access.member!.avatarUrl,
            },
          });
          return created;
        });
        publishGroupNavigation("channel.created", groupId, { channel });
        return reply.code(201).send({ channel });
      });

      app.get("/api/groups/:groupId/channels", async (request, reply) => {
        const { groupId } = request.params as { groupId: string };
        const access = await requireGroupMember(request, groupId);
        if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
        if (!access.member) return reply.code(403).send({ error: "FORBIDDEN" });
        const channels = await prisma.channel.findMany({
          where: { groupId },
          orderBy: { order: "asc" },
          include: { category: true },
        });
        return reply.send({ channels });
      });

      app.patch("/api/groups/:groupId/channels/:channelId", async (request, reply) => {
        const { groupId, channelId } = request.params as { groupId: string; channelId: string };
        const access = await requireGroupMember(request, groupId);
        if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
        if (!access.member || !hasMemberPermission(access.member.permissions, MemberPermission.MANAGE_CHANNELS)) {
          return reply.code(403).send({ error: "FORBIDDEN" });
        }
        const parsed = channelSchema.partial().safeParse(request.body);
        if (!parsed.success) return reply.code(400).send({ error: "INVALID_CHANNEL" });
        if (parsed.data.categoryId) {
          const category = await prisma.category.findFirst({ where: { id: parsed.data.categoryId, groupId } });
          if (!category) return reply.code(400).send({ error: "INVALID_CATEGORY" });
        }
        const channel = await prisma.channel.updateMany({
          where: { id: channelId, groupId },
          data: parsed.data,
        });
        if (channel.count === 0) return reply.code(404).send({ error: "CHANNEL_NOT_FOUND" });
        const updatedChannel = await prisma.channel.findUnique({ where: { id: channelId } });
        publishGroupNavigation("channel.updated", groupId, { channel: updatedChannel });
        return reply.send({ channel: updatedChannel });
      });

      app.delete("/api/groups/:groupId/channels/:channelId", async (request, reply) => {
        const { groupId, channelId } = request.params as { groupId: string; channelId: string };
        const access = await requireGroupMember(request, groupId);
        if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
        if (!access.member || !hasMemberPermission(access.member.permissions, MemberPermission.MANAGE_CHANNELS)) {
          return reply.code(403).send({ error: "FORBIDDEN" });
        }
        const result = await prisma.channel.deleteMany({ where: { id: channelId, groupId } });
        if (result.count === 0) return reply.code(404).send({ error: "CHANNEL_NOT_FOUND" });
        publishGroupNavigation("channel.deleted", groupId, { channelId });
        return reply.code(204).send();
      });

          app.get("/api/channels/:channelId/participants", async (request, reply) => {
            const { channelId } = request.params as { channelId: string };
            const access = await requireChannelAccess(request, channelId);
            if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
            if (!access.channel) return reply.code(404).send({ error: "CHANNEL_NOT_FOUND" });
            if (!access.member) {
              return reply.code(403).send({ error: "FORBIDDEN" });
            }
            const participants = await prisma.channelParticipant.findMany({
              where: { channelId },
              include: { user: true },
              orderBy: { user: { nickname: "asc" } },
            });
            return reply.send({
              participants: participants.map((participant) => ({
                ...participant,
                user: publicUser(participant.user),
              })),
            });
          });

          app.patch("/api/channels/:channelId/participants/:userId", async (request, reply) => {
            const { channelId, userId } = request.params as { channelId: string; userId: string };
            const access = await requireChannelAccess(request, channelId);
            if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
            if (!access.channel) return reply.code(404).send({ error: "CHANNEL_NOT_FOUND" });
            if (!access.member || !hasMemberPermission(access.member.permissions, MemberPermission.MANAGE_CHANNELS)) {
              return reply.code(403).send({ error: "FORBIDDEN" });
            }
            const parsed = participantUpdateSchema.safeParse(request.body);
            if (!parsed.success) return reply.code(400).send({ error: "INVALID_PARTICIPANT" });
            const participant = await prisma.channelParticipant.update({
              where: { channelId_userId: { channelId, userId } },
              data: parsed.data,
              include: { user: true },
            }).catch((error: unknown) => {
              if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
                return null;
              }
              throw error;
            });
            if (!participant) return reply.code(404).send({ error: "PARTICIPANT_NOT_FOUND" });
            return reply.send({
              participant: { ...participant, user: publicUser(participant.user) },
            });
          });

          app.patch("/api/channels/:channelId/activity", async (request, reply) => {
            const { channelId } = request.params as { channelId: string };
            const access = await requireChannelAccess(request, channelId);
            if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
            if (!access.channel || !access.member) return reply.code(403).send({ error: "FORBIDDEN" });
            const participant = await prisma.channelParticipant.upsert({
              where: { channelId_userId: { channelId, userId: access.user.id } },
              update: { lastActiveAt: new Date() },
              create: {
                channelId,
                userId: access.user.id,
                permissions: [ParticipantPermission.VIEW_CHANNEL, ParticipantPermission.SEND_MESSAGES],
                lastActiveAt: new Date(),
              },
            });
            return reply.send({ participant });
          });

          app.get("/api/channels/:channelId/messages", async (request, reply) => {
            const { channelId } = request.params as { channelId: string };
            const query = request.query as { before?: string; limit?: string };
            const access = await requireChannelAccess(request, channelId);
            if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
            if (!access.channel) return reply.code(404).send({ error: "CHANNEL_NOT_FOUND" });
            if (!access.member) {
              return reply.code(403).send({ error: "FORBIDDEN" });
            }
            const limit = Math.min(Math.max(Number(query.limit ?? 20) || 20, 1), 100);
            if (query.before && !/^[a-z0-9]+$/i.test(query.before)) {
              return reply.code(400).send({ error: "INVALID_CURSOR" });
            }
            const messages = await prisma.message.findMany({
              where: { channelId },
              orderBy: { createdAt: "desc" },
              take: limit + 1,
              ...(query.before ? { cursor: { id: query.before }, skip: 1 } : {}),
              include: { user: true },
            });
            const hasMore = messages.length > limit;
            const page = (hasMore ? messages.slice(0, limit) : messages).reverse();
            await prisma.channelParticipant.upsert({
              where: { channelId_userId: { channelId, userId: access.user.id } },
              update: { lastActiveAt: new Date() },
              create: {
                channelId,
                userId: access.user.id,
                permissions: [ParticipantPermission.VIEW_CHANNEL, ParticipantPermission.SEND_MESSAGES],
                lastActiveAt: new Date(),
              },
            });
            return reply.send({
              messages: page.map((message) => ({
                ...message,
                user: publicUser(message.user),
              })),
              hasMore,
              nextCursor: hasMore ? messages[limit - 1]?.id ?? null : null,
            });
          });

          app.post("/api/channels/:channelId/messages", async (request, reply) => {
            const { channelId } = request.params as { channelId: string };
            const access = await requireChannelAccess(request, channelId);
            if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
            if (!access.channel) return reply.code(404).send({ error: "CHANNEL_NOT_FOUND" });
            if (!access.member) {
              return reply.code(403).send({ error: "FORBIDDEN" });
            }
            const parsed = messageSchema.safeParse(request.body);
            if (!parsed.success) return reply.code(400).send({ error: "INVALID_MESSAGE" });
            if (access.user.lastMessagedAt && Date.now() - access.user.lastMessagedAt.getTime() < 1000) {
              return reply.code(429).header("retry-after", "1").send({ error: "RATE_LIMITED" });
            }
            const message = await prisma.$transaction(async (transaction) => {
              const created = await transaction.message.create({
                data: { channelId, userId: access.user!.id, ...parsed.data },
                include: { user: true },
              });
              await transaction.channel.update({
                where: { id: channelId },
                data: { lastMessageAt: created.createdAt },
              });
              await transaction.user.update({
                where: { id: access.user!.id },
                data: { lastMessagedAt: created.createdAt },
              });
              return created;
            });
            publishMessage(message);
            return reply.code(201).send({
              message: { ...message, user: publicUser(message.user) },
            });
          });

          app.patch("/api/channels/:channelId/messages/:messageId", async (request, reply) => {
            const { channelId, messageId } = request.params as { channelId: string; messageId: string };
            const access = await requireChannelAccess(request, channelId);
            if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
            if (!access.channel) return reply.code(404).send({ error: "CHANNEL_NOT_FOUND" });
            const existing = await prisma.message.findFirst({ where: { id: messageId, channelId } });
            if (!existing) return reply.code(404).send({ error: "MESSAGE_NOT_FOUND" });
            const canModerate = access.member
              ? hasMemberPermission(access.member.permissions, MemberPermission.MODERATE_MESSAGES)
              : false;
            if (existing.userId !== access.user.id && !canModerate) {
              return reply.code(403).send({ error: "FORBIDDEN" });
            }
            const parsed = z.object({ content: messageSchema.shape.content }).safeParse(request.body);
            if (!parsed.success) return reply.code(400).send({ error: "INVALID_MESSAGE" });
            const message = await prisma.message.update({
              where: { id: messageId },
              data: { content: parsed.data.content, edited: true },
              include: { user: true },
            });
            publishMessageUpdated(message);
            return reply.send({ message: { ...message, user: publicUser(message.user) } });
          });

          app.delete("/api/channels/:channelId/messages/:messageId", async (request, reply) => {
            const { channelId, messageId } = request.params as { channelId: string; messageId: string };
            const access = await requireChannelAccess(request, channelId);
            if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
            if (!access.channel) return reply.code(404).send({ error: "CHANNEL_NOT_FOUND" });
            const existing = await prisma.message.findFirst({ where: { id: messageId, channelId } });
            if (!existing) return reply.code(404).send({ error: "MESSAGE_NOT_FOUND" });
            const canModerate = access.member
              ? hasMemberPermission(access.member.permissions, MemberPermission.MODERATE_MESSAGES)
              : false;
            if (existing.userId !== access.user.id && !canModerate) {
              return reply.code(403).send({ error: "FORBIDDEN" });
            }
            await prisma.message.delete({ where: { id: messageId } });
            publishMessageDeleted(channelId, messageId);
            return reply.code(204).send();
          });

          app.post("/api/channels/:channelId/uploads", async (request, reply) => {
            const { channelId } = request.params as { channelId: string };
            const access = await requireChannelAccess(request, channelId);
            if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
            if (!access.channel || !access.member) return reply.code(403).send({ error: "FORBIDDEN" });
            const file = await request.file();
            if (!file || !mediaTypes.has(file.mimetype)) {
              return reply.code(400).send({ error: "UNSUPPORTED_FILE_TYPE" });
            }
            try {
              return reply.send(await storeUpload(file, `media/${access.channel.groupId}/${channelId}`, 8 * 1024 * 1024));
            } catch (error) {
              if (error instanceof Error && error.message === "FILE_TOO_LARGE") {
                return reply.code(413).send({ error: "FILE_TOO_LARGE" });
              }
              throw error;
            }
          });

          app.get("/api/groups/:groupId/emojis", async (request, reply) => {
            const { groupId } = request.params as { groupId: string };
            const access = await requireGroupMember(request, groupId);
            if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
            if (!access.member) return reply.code(403).send({ error: "FORBIDDEN" });
            return reply.send({ emojis: await prisma.emoji.findMany({ where: { groupId }, orderBy: { createdAt: "desc" }, take: 60 }) });
          });

          app.post("/api/groups/:groupId/emojis", async (request, reply) => {
            const { groupId } = request.params as { groupId: string };
            const access = await requireGroupMember(request, groupId);
            if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
            if (!access.member || !hasMemberPermission(access.member.permissions, MemberPermission.MANAGE_EMOTES)) {
              return reply.code(403).send({ error: "FORBIDDEN" });
            }
            const parts = request.parts();
            let name = "";
            let filePart: Awaited<ReturnType<FastifyRequest["file"]>> | undefined;
            for await (const part of parts) {
              if (part.type === "field" && part.fieldname === "name") name = String(part.value);
              if (part.type === "file") filePart = part;
            }
            const parsed = emojiSchema.safeParse({ name });
            if (!parsed.success || !filePart || !imageTypes.has(filePart.mimetype)) {
              return reply.code(400).send({ error: "INVALID_EMOJI" });
            }
            try {
              const upload = await storeUpload(filePart, `emoji/${groupId}`, 1 * 1024 * 1024);
              const emoji = await prisma.emoji.create({ data: { groupId, name: parsed.data.name, fileUrl: upload.url } });
              return reply.code(201).send({ emoji });
            } catch (error) {
              if (error instanceof Error && error.message === "FILE_TOO_LARGE") {
                return reply.code(413).send({ error: "FILE_TOO_LARGE" });
              }
              if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
                return reply.code(409).send({ error: "EMOJI_NAME_TAKEN" });
              }
              throw error;
            }
          });

  app.patch("/api/profile", async (request, reply) => {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return reply.code(401).send({
        error: "UNAUTHENTICATED",
        message: "Authentication is required",
      });
    }

    const parsed = profileUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "INVALID_PROFILE",
        message: parsed.error.issues[0]?.message ?? "Invalid profile",
      });
    }

    const username = parsed.data.username;
    try {
      const updatedUser = await prisma.$transaction(async (transaction) => {
        const updated = await transaction.user.update({
          where: { id: user.id },
          data: {
            ...(username
              ? {
                  username,
                  normalizedUsername: normalizeUsername(username),
                }
              : {}),
            ...(parsed.data.nickname ? { nickname: parsed.data.nickname } : {}),
          },
        });
        if (parsed.data.nickname) {
          await transaction.groupMember.updateMany({
            where: { userId: user.id },
            data: { nickname: parsed.data.nickname },
          });
        }
        return updated;
      });
      if (parsed.data.nickname) {
        const memberships = await prisma.groupMember.findMany({
          where: { userId: user.id },
          select: { groupId: true },
        });
        for (const membership of memberships) {
          publishGroupNavigation("user.updated", membership.groupId, {
            userId: user.id,
            nickname: updatedUser.nickname,
          });
        }
      }
      return reply.send({ user: publicUser(updatedUser) });
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        return reply.code(409).send({
          error: "USERNAME_TAKEN",
          message: "That username is already in use",
        });
      }
      throw error;
    }
  });

  app.post("/api/profile/avatar", async (request, reply) => {
    const user = await getAuthenticatedUser(request);
    if (!user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const file = await request.file();
    if (!file || !imageTypes.has(file.mimetype)) return reply.code(400).send({ error: "UNSUPPORTED_FILE_TYPE" });
    try {
      const upload = await storeUpload(file, `profiles/${user.id}`, 2 * 1024 * 1024);
      const updatedUser = await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: upload.url } });
      return reply.send({ user: publicUser(updatedUser) });
    } catch (error) {
      if (error instanceof Error && error.message === "FILE_TOO_LARGE") {
        return reply.code(413).send({ error: "FILE_TOO_LARGE" });
      }
      throw error;
    }
  });

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  return app;
}
