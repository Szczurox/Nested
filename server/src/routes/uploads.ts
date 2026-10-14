import type { FastifyInstance } from "fastify";

import { requireChannelAccess } from "../channel-access.js";
import {
  isFileTooLarge,
  mediaTypes,
  readStoredFile,
  storeUpload,
  uploadLimits,
} from "../storage.js";

export function registerUploadRoutes(app: FastifyInstance): void {
  // Serves stored files (avatars, group icons, emoji, channel media).
  app.get("/uploads/*", async (request, reply) => {
    const wildcard = (request.params as { "*": string })["*"];
    try {
      const file = await readStoredFile(wildcard);
      if (!file) return reply.code(400).send({ error: "INVALID_FILE_PATH" });
      return reply.type(file.contentType).send(file.data);
    } catch {
      return reply.code(404).send({ error: "FILE_NOT_FOUND" });
    }
  });

  // Accepts image/video attachments for a channel.
  app.post("/api/channels/:channelId/uploads", async (request, reply) => {
    const { channelId } = request.params as { channelId: string };
    const access = await requireChannelAccess(request, channelId);
    if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    if (!access.channel || !access.member) return reply.code(403).send({ error: "FORBIDDEN" });
    const file = await request.file();
    if (!file || !mediaTypes.has(file.mimetype)) {
      return reply.code(400).send({ error: "UNSUPPORTED_FILE_TYPE" });
    }
    try {
      return reply.send(
        await storeUpload(file, `media/${access.channel.groupId}/${channelId}`, uploadLimits.media)
      );
    } catch (error) {
      if (isFileTooLarge(error)) {
        return reply.code(413).send({ error: "FILE_TOO_LARGE" });
      }
      throw error;
    }
  });
}
