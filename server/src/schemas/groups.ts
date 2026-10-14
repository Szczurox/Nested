import { z } from "zod";
import { MemberPermission } from "@prisma/client";

export const groupSchema = z.object({ name: z.string().trim().min(1).max(80) });

export const inviteSchema = z.object({ expiresAt: z.string().datetime().optional() });

export const categorySchema = z.object({ name: z.string().trim().min(1).max(80) });

export const memberUpdateSchema = z.object({
  nickname: z.string().trim().min(1).max(32).optional(),
  nameColor: z.string().max(32).optional(),
  permissions: z.array(z.nativeEnum(MemberPermission)).optional(),
});
