import type { FastifyInstance } from "fastify";
import { MemberPermission } from "@prisma/client";

import { hasMemberPermission, publicUser } from "../auth.js";
import { requireChannelAccess, touchChannelActivity } from "../channel-access.js";
import { prisma } from "../db.js";
import { participantUpdateSchema } from "../schemas/channels.js";
import { isPrismaError } from "../utils/errors.js";

export function registerParticipantRoutes(app: FastifyInstance): void {
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
      if (isPrismaError(error, "P2025")) return null;
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
    const participant = await touchChannelActivity(channelId, access.user.id);
    return reply.send({ participant });
  });
}
