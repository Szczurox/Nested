import type { FastifyInstance } from "fastify";

import {
  clearSessionCookie,
  createSession,
  getAuthenticatedUser,
  hashPassword,
  normalizeUsername,
  publicUser,
  setSessionCookie,
  verifyPassword,
} from "../auth.js";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { credentialsSchema } from "../schemas/auth.js";
import { isPrismaError } from "../utils/errors.js";

export function registerAuthRoutes(app: FastifyInstance): void {
  app.post("/api/auth/register", async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "INVALID_CREDENTIALS",
        message: parsed.error.issues[0]?.message ?? "Invalid credentials",
      });
    }

    const username = parsed.data.username.trim();
    const normalizedUsername = normalizeUsername(username);
    const passwordHash = await hashPassword(parsed.data.password);

    try {
      const result = await prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            username,
            normalizedUsername,
            passwordHash,
            nickname: username,
          },
        });
        const session = await createSession(user.id, transaction);
        return { user, session };
      });
      setSessionCookie(reply, result.session);
      return reply.code(201).send({ user: publicUser(result.user) });
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

  app.post("/api/auth/login", async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "INVALID_CREDENTIALS",
        message: "Username or password is invalid",
      });
    }

    const user = await prisma.user.findUnique({
      where: { normalizedUsername: normalizeUsername(parsed.data.username) },
    });
    if (!user || !(await verifyPassword(user.passwordHash, parsed.data.password))) {
      return reply.code(401).send({
        error: "INVALID_LOGIN",
        message: "Username or password is invalid",
      });
    }

    const session = await createSession(user.id);
    setSessionCookie(reply, session);
    return reply.send({ user: publicUser(user) });
  });

  app.post("/api/auth/logout", async (request, reply) => {
    const sessionId = request.cookies[config.SESSION_COOKIE_NAME];
    if (sessionId) {
      await prisma.session.deleteMany({ where: { id: sessionId } });
    }
    clearSessionCookie(reply);
    return reply.code(204).send();
  });

  app.get("/api/auth/me", async (request, reply) => {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return reply.code(401).send({
        error: "UNAUTHENTICATED",
        message: "Authentication is required",
      });
    }
    return reply.send({ user: publicUser(user) });
  });
}
