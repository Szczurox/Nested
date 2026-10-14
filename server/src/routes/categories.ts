import type { FastifyInstance } from "fastify";
import { MemberPermission } from "@prisma/client";

import { hasMemberPermission, requireGroupMember } from "../auth.js";
import { prisma } from "../db.js";
import { publishGroupNavigation } from "../realtime.js";
import { categorySchema } from "../schemas/groups.js";

export function registerCategoryRoutes(app: FastifyInstance): void {
  app.post("/api/groups/:groupId/categories", async (request, reply) => {
    const { groupId } = request.params as { groupId: string };
    const access = await requireGroupMember(request, groupId);
    if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    if (!access.member || !hasMemberPermission(access.member.permissions, MemberPermission.MANAGE_CHANNELS)) {
      return reply.code(403).send({ error: "FORBIDDEN" });
    }
    const parsed = categorySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_CATEGORY" });
    const category = await prisma.category.create({ data: { groupId, name: parsed.data.name } });
    publishGroupNavigation("category.created", groupId, { category });
    return reply.code(201).send({ category });
  });

  app.get("/api/groups/:groupId/categories", async (request, reply) => {
    const { groupId } = request.params as { groupId: string };
    const access = await requireGroupMember(request, groupId);
    if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    if (!access.member) return reply.code(403).send({ error: "FORBIDDEN" });
    const categories = await prisma.category.findMany({
      where: { groupId },
      include: { channels: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
    return reply.send({ categories });
  });

  app.patch("/api/groups/:groupId/categories/:categoryId", async (request, reply) => {
    const { groupId, categoryId } = request.params as { groupId: string; categoryId: string };
    const access = await requireGroupMember(request, groupId);
    if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    if (!access.member || !hasMemberPermission(access.member.permissions, MemberPermission.MANAGE_CHANNELS)) {
      return reply.code(403).send({ error: "FORBIDDEN" });
    }
    const parsed = categorySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_CATEGORY" });
    const category = await prisma.category.updateMany({
      where: { id: categoryId, groupId },
      data: { name: parsed.data.name },
    });
    if (category.count === 0) return reply.code(404).send({ error: "CATEGORY_NOT_FOUND" });
    const updatedCategory = await prisma.category.findUnique({ where: { id: categoryId } });
    publishGroupNavigation("category.updated", groupId, { category: updatedCategory });
    return reply.send({ category: updatedCategory });
  });

  app.delete("/api/groups/:groupId/categories/:categoryId", async (request, reply) => {
    const { groupId, categoryId } = request.params as { groupId: string; categoryId: string };
    const access = await requireGroupMember(request, groupId);
    if (!access.user) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    if (!access.member || !hasMemberPermission(access.member.permissions, MemberPermission.MANAGE_CHANNELS)) {
      return reply.code(403).send({ error: "FORBIDDEN" });
    }
    const result = await prisma.$transaction(async (transaction) => {
      const category = await transaction.category.findFirst({ where: { id: categoryId, groupId } });
      if (!category) return false;
      await transaction.channel.updateMany({
        where: { categoryId },
        data: { categoryId: null },
      });
      await transaction.category.delete({ where: { id: categoryId } });
      return true;
    });
    if (!result) return reply.code(404).send({ error: "CATEGORY_NOT_FOUND" });
    publishGroupNavigation("category.deleted", groupId, { categoryId });
    return reply.code(204).send();
  });
}
