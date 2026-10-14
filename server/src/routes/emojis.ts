import type { FastifyInstance } from "fastify";
import { MemberPermission } from "@prisma/client";

import { hasMemberPermission, requireGroupMember } from "../auth.js";
import { prisma } from "../db.js";
import { emojiSchema } from "../schemas/emojis.js";
import {
	imageTypes,
	isFileTooLarge,
	storeUpload,
	uploadLimits,
	type UploadedFile,
} from "../storage.js";
import { isPrismaError } from "../utils/errors.js";

export function registerEmojiRoutes(app: FastifyInstance): void {
	app.get("/api/groups/:groupId/emojis", async (request, reply) => {
		const { groupId } = request.params as { groupId: string };
		const access = await requireGroupMember(request, groupId);
		if (!access.user)
			return reply.code(401).send({ error: "UNAUTHENTICATED" });
		if (!access.member) return reply.code(403).send({ error: "FORBIDDEN" });
		return reply.send({
			emojis: await prisma.emoji.findMany({
				where: { groupId },
				orderBy: { createdAt: "desc" },
				take: 60,
			}),
		});
	});

	app.post("/api/groups/:groupId/emojis", async (request, reply) => {
		const { groupId } = request.params as { groupId: string };
		const access = await requireGroupMember(request, groupId);
		if (!access.user)
			return reply.code(401).send({ error: "UNAUTHENTICATED" });
		if (
			!access.member ||
			!hasMemberPermission(
				access.member.permissions,
				MemberPermission.MANAGE_EMOTES,
			)
		)
			return reply.code(403).send({ error: "FORBIDDEN" });
		const parts = request.parts();
		let name = "";
		let filePart: UploadedFile | undefined;
		for await (const part of parts) {
			if (part.type === "field" && part.fieldname === "name")
				name = String(part.value);
			if (part.type === "file") filePart = part;
		}
		const parsed = emojiSchema.safeParse({ name });
		if (!parsed.success || !filePart || !imageTypes.has(filePart.mimetype))
			return reply.code(400).send({ error: "INVALID_EMOJI" });

		try {
			const upload = await storeUpload(
				filePart,
				`emoji/${groupId}`,
				uploadLimits.emoji,
			);
			const emoji = await prisma.emoji.create({
				data: { groupId, name: parsed.data.name, fileUrl: upload.url },
			});
			return reply.code(201).send({ emoji });
		} catch (error) {
			if (isFileTooLarge(error))
				return reply.code(413).send({ error: "FILE_TOO_LARGE" });
			if (isPrismaError(error, "P2002"))
				return reply.code(409).send({ error: "EMOJI_NAME_TAKEN" });
			throw error;
		}
	});
}
