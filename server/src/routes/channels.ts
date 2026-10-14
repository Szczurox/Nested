import type { FastifyInstance } from "fastify";
import { MemberPermission, ParticipantPermission } from "@prisma/client";

import { hasMemberPermission, requireGroupMember } from "../auth.js";
import { prisma } from "../db.js";
import { publishGroupNavigation } from "../realtime.js";
import { channelSchema } from "../schemas/channels.js";

export function registerChannelRoutes(app: FastifyInstance): void {
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
}
