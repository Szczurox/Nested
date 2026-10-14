import { z } from "zod";
import { ChannelType, ParticipantPermission } from "@prisma/client";

export const channelSchema = z.object({
  name: z.string().trim().min(1).max(80),
  categoryId: z.string().cuid().nullable().optional(),
  type: z.nativeEnum(ChannelType).default(ChannelType.TEXT),
});

export const participantUpdateSchema = z.object({
  permissions: z.array(z.nativeEnum(ParticipantPermission)).optional(),
  nickname: z.string().trim().min(1).max(32).nullable().optional(),
  avatarUrl: z.string().url().max(2048).nullable().optional(),
});

export const messageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  file: z.string().url().max(2048).optional(),
  fileType: z.string().max(80).optional(),
  emojiBucket: z.array(z.string().max(2048)).max(50).default([]),
});

export const messageEditSchema = z.object({ content: messageSchema.shape.content });
