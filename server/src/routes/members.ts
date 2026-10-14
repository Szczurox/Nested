import type { FastifyInstance } from "fastify";
import { MemberPermission } from "@prisma/client";

import { hasMemberPermission, requireGroupMember } from "../auth.js";
import { prisma } from "../db.js";
import { memberUpdateSchema } from "../schemas/groups.js";

export function registerMemberRoutes(app: FastifyInstance): void {
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
}
