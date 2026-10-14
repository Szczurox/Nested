import type { FastifyInstance } from "fastify";
import { MemberPermission } from "@prisma/client";

import { getAuthenticatedUser, hasMemberPermission, requireGroupMember } from "../auth.js";
import { prisma } from "../db.js";
import { defaultMemberPermissions } from "../permissions.js";
import { groupSchema } from "../schemas/groups.js";
import { imageTypes, isFileTooLarge, storeUpload, uploadLimits } from "../storage.js";

export function registerGroupRoutes(app: FastifyInstance): void {
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
      : { ...access.member, permissions: defaultMemberPermissions() };
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
      const upload = await storeUpload(file, `groups/${groupId}`, uploadLimits.groupIcon);
      const group = await prisma.group.update({
        where: { id: groupId },
        data: { icon: upload.url },
      });
      return reply.send({ group });
    } catch (error) {
      if (isFileTooLarge(error)) {
        return reply.code(413).send({ error: "FILE_TOO_LARGE" });
      }
      throw error;
    }
  });
}
