import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import sensible from "@fastify/sensible";

import { config } from "./config.js";
import { prisma } from "./db.js";
import { uploadLimits } from "./storage.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerCategoryRoutes } from "./routes/categories.js";
import { registerChannelRoutes } from "./routes/channels.js";
import { registerEmojiRoutes } from "./routes/emojis.js";
import { registerGroupRoutes } from "./routes/groups.js";
import { registerInviteRoutes } from "./routes/invites.js";
import { registerMemberRoutes } from "./routes/members.js";
import { registerMessageRoutes } from "./routes/messages.js";
import { registerParticipantRoutes } from "./routes/participants.js";
import { registerProfileRoutes } from "./routes/profile.js";
import { registerUploadRoutes } from "./routes/uploads.js";

export function buildApp(options: { logger?: boolean } = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false });

  app.register(cookie);
  app.register(multipart, { limits: { fileSize: uploadLimits.media, files: 1 } });
  app.register(cors, {
    origin: config.WEB_ORIGIN,
    credentials: true,
  });
  registerUploadRoutes(app);
  app.register(sensible);

  app.get("/health", async () => ({ status: "ok" }));

  registerAuthRoutes(app);
  registerProfileRoutes(app);
  registerGroupRoutes(app);
  registerMemberRoutes(app);
  registerInviteRoutes(app);
  registerCategoryRoutes(app);
  registerChannelRoutes(app);
  registerParticipantRoutes(app);
  registerMessageRoutes(app);
  registerEmojiRoutes(app);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  return app;
}
