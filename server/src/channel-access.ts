import type { FastifyRequest } from "fastify";

import { getAuthenticatedUser } from "./auth.js";
import { prisma } from "./db.js";
import { defaultParticipantPermissions } from "./permissions.js";

/** Resolves the authenticated user plus the channel, their group membership and channel participation. */
export async function requireChannelAccess(request: FastifyRequest, channelId: string) {
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

/** Marks the user as active in the channel, creating a default participant row if needed. */
export function touchChannelActivity(channelId: string, userId: string) {
  return prisma.channelParticipant.upsert({
    where: { channelId_userId: { channelId, userId } },
    update: { lastActiveAt: new Date() },
    create: {
      channelId,
      userId,
      permissions: defaultParticipantPermissions(),
      lastActiveAt: new Date(),
    },
  });
}
