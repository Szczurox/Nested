import type { FastifyInstance } from "fastify";

import { getAuthenticatedUser, normalizeUsername, publicUser } from "../auth.js";
import { prisma } from "../db.js";
import { publishGroupNavigation } from "../realtime.js";
import { profileUpdateSchema } from "../schemas/auth.js";
import { imageTypes, isFileTooLarge, storeUpload, uploadLimits } from "../storage.js";
import { isPrismaError } from "../utils/errors.js";

export function registerProfileRoutes(app: FastifyInstance): void {
  app.get("/api/profile", async (request, reply) => {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return reply.code(401).send({
        error: "UNAUTHENTICATED",
        message: "Authentication is required",
      });
    }
    return reply.send({ user: publicUser(user) });
  });

  app.patch("/api/profile", async (request, reply) => {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return reply.code(401).send({
        error: "UNAUTHENTICATED",
        message: "Authentication is required",
      });
    }

    const parsed = profileUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "INVALID_PROFILE",
        message: parsed.error.issues[0]?.message ?? "Invalid profile",
      });
    }

    const username = parsed.data.username;
    try {
      const updatedUser = await prisma.$transaction(async (transaction) => {
        const updated = await transaction.user.update({
          where: { id: user.id },
          data: {
            ...(username
              ? {
                  username,
                  normalizedUsername: normalizeUsername(username),
                }
              : {}),
            ...(parsed.data.nickname ? { nickname: parsed.data.nickname } : {}),
          },
        });
        if (parsed.data.nickname) {
          await transaction.groupMember.updateMany({
            where: { userId: user.id },
            data: { nickname: parsed.data.nickname },
          });
        }
        return updated;
      });
      if (parsed.data.nickname) {
        const memberships = await prisma.groupMember.findMany({
          where: { userId: user.id },
          select: { groupId: true },
        });
        for (const membership of memberships) {
          publishGroupNavigation("user.updated", membership.groupId, {
            userId: user.id,
            nickname: updatedUser.nickname,
          });
        }
      }
      return reply.send({ user: publicUser(updatedUser) });
    } catch (error: unknown) {
      if (isPrismaError(error, "P2002")) {
        return reply.code(409).send({
          error: "USERNAME_TAKEN",
          message: "That username is already in use",
        });
      }
      throw error;
    }
  });

  app.post("/api/profile/avatar", async (request, reply) => {
    const user = await getAuthenticatedUser(request);
    if (!user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const file = await request.file();
    if (!file || !imageTypes.has(file.mimetype)) return reply.code(400).send({ error: "UNSUPPORTED_FILE_TYPE" });
    try {
      const upload = await storeUpload(file, `profiles/${user.id}`, uploadLimits.avatar);
      const updatedUser = await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: upload.url } });
      return reply.send({ user: publicUser(updatedUser) });
    } catch (error) {
      if (isFileTooLarge(error)) {
        return reply.code(413).send({ error: "FILE_TOO_LARGE" });
      }
      throw error;
    }
  });
}
