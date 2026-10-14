import type { FastifyInstance } from "fastify";
import { MemberPermission } from "@prisma/client";

import { getAuthenticatedUser, hasMemberPermission, requireGroupMember } from "../auth.js";
import { prisma } from "../db.js";
import { defaultMemberPermissions } from "../permissions.js";
import { inviteSchema } from "../schemas/groups.js";

export function registerInviteRoutes(app: FastifyInstance): void {
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
          permissions: defaultMemberPermissions(),
        },
        create: {
          groupId,
          userId: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          permissions: defaultMemberPermissions(),
          inviteId,
        },
      });
      return member;
    });
    if (!result) return reply.code(404).send({ error: "INVITE_NOT_FOUND" });
    return reply.send({ member: result });
  });
}
