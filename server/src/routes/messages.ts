import type { FastifyInstance } from "fastify";
import { MemberPermission } from "@prisma/client";

import { hasMemberPermission, publicUser } from "../auth.js";
import { requireChannelAccess, touchChannelActivity } from "../channel-access.js";
import { prisma } from "../db.js";
import {
  publishMessage,
  publishMessageDeleted,
  publishMessageUpdated,
} from "../realtime.js";
import { messageEditSchema, messageSchema } from "../schemas/channels.js";

export function registerMessageRoutes(app: FastifyInstance): void {
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
    await touchChannelActivity(channelId, access.user.id);
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
    const parsed = messageEditSchema.safeParse(request.body);
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
}
