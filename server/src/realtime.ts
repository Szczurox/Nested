import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { ParticipantPermission } from "@prisma/client";
import { z } from "zod";

import { config } from "./config.js";
import { getAuthenticatedUserBySessionId, publicUser } from "./auth.js";
import { prisma } from "./db.js";

const channelPayload = z.object({ channelId: z.string().cuid() });
const typingPayload = channelPayload.extend({ typing: z.boolean() });
const messagePayload = channelPayload.extend({
	content: z.string().trim().min(1).max(4000),
	file: z.string().url().max(2048).optional(),
	fileType: z.string().max(80).optional(),
	emojiBucket: z.array(z.string().max(80)).max(50).default([]),
});

let realtimeServer: Server | null = null;

function sessionIdFromCookie(header: string | undefined): string | undefined {
	const cookie = header
		?.split(";")
		.map((part) => part.trim())
		.find((part) => part.startsWith(`${config.SESSION_COOKIE_NAME}=`));
	return cookie?.slice(config.SESSION_COOKIE_NAME.length + 1);
}

async function getChannelAccess(channelId: string, userId: string) {
	const channel = await prisma.channel.findUnique({
		where: { id: channelId },
	});
	if (!channel) return null;
	const member = await prisma.groupMember.findUnique({
		where: { groupId_userId: { groupId: channel.groupId, userId } },
	});
	if (!member) return null;
	return { channel, member };
}

function room(channelId: string): string {
	return `channel:${channelId}`;
}

export function groupRoom(groupId: string): string {
	return `group:${groupId}`;
}

export function publishGroupNavigation(
	event:
		| "category.created"
		| "category.updated"
		| "category.deleted"
		| "channel.created"
		| "channel.updated"
		| "channel.deleted"
		| "user.updated",
	groupId: string,
	payload: Record<string, unknown> = {},
): void {
	realtimeServer
		?.to(groupRoom(groupId))
		.emit(`group.${event}`, { groupId, ...payload });
}

function voiceRoom(channelId: string): string {
	return `voice:${channelId}`;
}

function emitMessage(message: {
	id: string;
	channelId: string;
	userId: string;
	content: string;
	file: string | null;
	fileType: string | null;
	edited: boolean;
	emojiBucket: string[];
	createdAt: Date;
	updatedAt: Date;
	user: Parameters<typeof publicUser>[0];
}): void {
	realtimeServer?.to(room(message.channelId)).emit("message.created", {
		...message,
		user: publicUser(message.user),
	});
}

export function publishMessage(
	message: Parameters<typeof emitMessage>[0],
): void {
	emitMessage(message);
}

export function publishMessageUpdated(
	message: Parameters<typeof emitMessage>[0],
): void {
	realtimeServer?.to(room(message.channelId)).emit("message.updated", {
		...message,
		user: publicUser(message.user),
	});
}

export function publishMessageDeleted(
	channelId: string,
	messageId: string,
): void {
	realtimeServer?.to(room(channelId)).emit("message.deleted", {
		channelId,
		messageId,
	});
}

export function registerRealtime(httpServer: HttpServer): Server {
	const io = new Server(httpServer, {
		cors: {
			origin: config.WEB_ORIGIN,
			credentials: true,
		},
	});
	realtimeServer = io;

	io.use(async (socket, next) => {
		const user = await getAuthenticatedUserBySessionId(
			sessionIdFromCookie(socket.handshake.headers.cookie),
		);
		if (!user) return next(new Error("UNAUTHENTICATED"));
		socket.data.user = user;
		next();
	});

	io.on("connection", (socket) => {
		const user = socket.data.user as Awaited<
			ReturnType<typeof getAuthenticatedUserBySessionId>
		>;
		if (!user) return;
		const joinedChannels = new Set<string>();
		const joinedVoiceChannels = new Set<string>();
		const joinedGroups = new Set<string>();

		socket.on(
			"group.join",
			async (payload: unknown, callback?: (result: object) => void) => {
				const parsed = z
					.object({ groupId: z.string().cuid() })
					.safeParse(payload);
				if (!parsed.success)
					return callback?.({ error: "INVALID_GROUP" });
				const member = await prisma.groupMember.findUnique({
					where: {
						groupId_userId: {
							groupId: parsed.data.groupId,
							userId: user.id,
						},
					},
				});
				if (!member) return callback?.({ error: "FORBIDDEN" });
				joinedGroups.add(parsed.data.groupId);
				socket.join(groupRoom(parsed.data.groupId));
				callback?.({ ok: true });
			},
		);

		socket.on("group.leave", (payload: unknown) => {
			const parsed = z
				.object({ groupId: z.string().cuid() })
				.safeParse(payload);
			if (!parsed.success) return;
			joinedGroups.delete(parsed.data.groupId);
			socket.leave(groupRoom(parsed.data.groupId));
		});

		socket.on(
			"channel.join",
			async (payload: unknown, callback?: (result: object) => void) => {
				const parsed = channelPayload.safeParse(payload);
				if (!parsed.success)
					return callback?.({ error: "INVALID_CHANNEL" });
				const access = await getChannelAccess(
					parsed.data.channelId,
					user.id,
				);
				if (!access) return callback?.({ error: "FORBIDDEN" });
				joinedChannels.add(parsed.data.channelId);
				socket.join(room(parsed.data.channelId));
				await prisma.channelParticipant.upsert({
					where: {
						channelId_userId: {
							channelId: parsed.data.channelId,
							userId: user.id,
						},
					},
					update: { connected: true, lastActiveAt: new Date() },
					create: {
						channelId: parsed.data.channelId,
						userId: user.id,
						connected: true,
						lastActiveAt: new Date(),
						permissions: [
							ParticipantPermission.VIEW_CHANNEL,
							ParticipantPermission.SEND_MESSAGES,
						],
					},
				});
				socket
					.to(room(parsed.data.channelId))
					.emit("presence.updated", {
						channelId: parsed.data.channelId,
						userId: user.id,
						connected: true,
					});
				const connectedParticipants =
					await prisma.channelParticipant.findMany({
						where: {
							channelId: parsed.data.channelId,
							connected: true,
						},
						select: { userId: true },
					});
				for (const participant of connectedParticipants) {
					socket.emit("presence.updated", {
						channelId: parsed.data.channelId,
						userId: participant.userId,
						connected: true,
					});
				}
				callback?.({ ok: true });
			},
		);

		socket.on("channel.leave", async (payload: unknown) => {
			const parsed = channelPayload.safeParse(payload);
			if (!parsed.success) return;
			joinedChannels.delete(parsed.data.channelId);
			socket.leave(room(parsed.data.channelId));
			await prisma.channelParticipant.updateMany({
				where: { channelId: parsed.data.channelId, userId: user.id },
				data: { connected: false },
			});
			socket.to(room(parsed.data.channelId)).emit("presence.updated", {
				channelId: parsed.data.channelId,
				userId: user.id,
				connected: false,
			});
		});

		socket.on("typing.updated", async (payload: unknown) => {
			const parsed = typingPayload.safeParse(payload);
			if (!parsed.success || !joinedChannels.has(parsed.data.channelId))
				return;
			const access = await getChannelAccess(
				parsed.data.channelId,
				user.id,
			);
			if (!access) return;
			await prisma.channelParticipant.updateMany({
				where: { channelId: parsed.data.channelId, userId: user.id },
				data: { lastTypingAt: parsed.data.typing ? new Date() : null },
			});
			socket.to(room(parsed.data.channelId)).emit("typing.updated", {
				channelId: parsed.data.channelId,
				userId: user.id,
				nickname: user.nickname,
				typing: parsed.data.typing,
			});
		});

		socket.on(
			"voice.join",
			async (payload: unknown, callback?: (result: object) => void) => {
				const parsed = channelPayload.safeParse(payload);
				if (!parsed.success)
					return callback?.({ error: "INVALID_CHANNEL" });
				const access = await getChannelAccess(
					parsed.data.channelId,
					user.id,
				);
				if (!access || access.channel.type !== "VOICE") {
					return callback?.({ error: "FORBIDDEN" });
				}
				const voiceRoomName = voiceRoom(parsed.data.channelId);
				const existingSockets = [
					...(io.sockets.adapter.rooms.get(voiceRoomName) ?? []),
				];
				joinedVoiceChannels.add(parsed.data.channelId);
				await socket.join(voiceRoomName);
				await prisma.channelParticipant.upsert({
					where: {
						channelId_userId: {
							channelId: parsed.data.channelId,
							userId: user.id,
						},
					},
					update: { connected: true, lastActiveAt: new Date() },
					create: {
						channelId: parsed.data.channelId,
						userId: user.id,
						connected: true,
						lastActiveAt: new Date(),
						permissions: [ParticipantPermission.VIEW_CHANNEL],
					},
				});
				callback?.({ ok: true, clients: existingSockets });
				socket.to(voiceRoomName).emit("voice.joined", {
					userId: user.id,
					socketId: socket.id,
				});
			},
		);

		socket.on("voice.leave", async (payload: unknown) => {
			const parsed = channelPayload.safeParse(payload);
			if (
				!parsed.success ||
				!joinedVoiceChannels.has(parsed.data.channelId)
			)
				return;
			joinedVoiceChannels.delete(parsed.data.channelId);
			const voiceRoomName = voiceRoom(parsed.data.channelId);
			await socket.leave(voiceRoomName);
			await prisma.channelParticipant.updateMany({
				where: { channelId: parsed.data.channelId, userId: user.id },
				data: { connected: false },
			});
			socket
				.to(voiceRoomName)
				.emit("voice.left", { socketId: socket.id });
		});

		socket.on("get clients", () => {
			const channelId = [...joinedVoiceChannels][0];
			if (!channelId) return;
			const clients = [
				...(io.sockets.adapter.rooms.get(voiceRoom(channelId)) ?? []),
			];
			socket.emit("all clients", clients);
		});

		socket.on("sending signal", (payload: unknown) => {
			const parsed = z
				.object({
					clientToSignal: z.string().min(1),
					signal: z.unknown(),
				})
				.safeParse(payload);
			const channelId = [...joinedVoiceChannels][0];
			if (!parsed.success || !channelId) return;
			io.to(parsed.data.clientToSignal).emit("joined", {
				signal: parsed.data.signal,
				id: socket.id,
			});
		});

		socket.on("returning signal", (payload: unknown) => {
			const parsed = z
				.object({
					callerID: z.string().min(1),
					signal: z.unknown(),
				})
				.safeParse(payload);
			const channelId = [...joinedVoiceChannels][0];
			if (!parsed.success || !channelId) return;
			io.to(parsed.data.callerID).emit("returned signal", {
				signal: parsed.data.signal,
				id: socket.id,
			});
		});

		socket.on(
			"message.send",
			async (payload: unknown, callback?: (result: object) => void) => {
				const parsed = messagePayload.safeParse(payload);
				if (!parsed.success)
					return callback?.({ error: "INVALID_MESSAGE" });
				const access = await getChannelAccess(
					parsed.data.channelId,
					user.id,
				);
				if (!access) {
					return callback?.({ error: "FORBIDDEN" });
				}
				if (
					user.lastMessagedAt &&
					Date.now() - user.lastMessagedAt.getTime() < 1000
				) {
					return callback?.({ error: "RATE_LIMITED" });
				}
				const message = await prisma.$transaction(
					async (transaction) => {
						const created = await transaction.message.create({
							data: { ...parsed.data, userId: user.id },
							include: { user: true },
						});
						await transaction.channel.update({
							where: { id: parsed.data.channelId },
							data: { lastMessageAt: created.createdAt },
						});
						await transaction.user.update({
							where: { id: user.id },
							data: { lastMessagedAt: created.createdAt },
						});
						return created;
					},
				);
				emitMessage(message);
				callback?.({
					ok: true,
					message: { ...message, user: publicUser(message.user) },
				});
			},
		);

		socket.on("disconnect", async () => {
			await prisma.channelParticipant.updateMany({
				where: {
					userId: user.id,
					channelId: { in: [...joinedChannels] },
				},
				data: { connected: false },
			});
			for (const channelId of joinedChannels) {
				socket.to(room(channelId)).emit("presence.updated", {
					channelId,
					userId: user.id,
					connected: false,
				});
			}
			for (const channelId of joinedVoiceChannels) {
				await prisma.channelParticipant.updateMany({
					where: { channelId, userId: user.id },
					data: { connected: false },
				});
				socket.to(voiceRoom(channelId)).emit("left", { id: socket.id });
			}
			for (const groupId of joinedGroups)
				socket.leave(groupRoom(groupId));
		});
	});

	return io;
}
