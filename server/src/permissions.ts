import { MemberPermission, ParticipantPermission } from "@prisma/client";

/** Permissions given to someone who joins a group via invite (and fallback for members with none). */
export function defaultMemberPermissions(): MemberPermission[] {
  return [MemberPermission.VIEW_CHANNEL, MemberPermission.SEND_MESSAGES];
}

/** Permissions given to a user who is auto-added to a channel on first activity. */
export function defaultParticipantPermissions(): ParticipantPermission[] {
  return [ParticipantPermission.VIEW_CHANNEL, ParticipantPermission.SEND_MESSAGES];
}
