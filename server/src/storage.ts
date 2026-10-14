import type { FastifyRequest } from "fastify";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import { config } from "./config.js";

export const imageTypes = new Set([
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/webp",
]);
export const mediaTypes = new Set([
	...imageTypes,
	"video/mp4",
	"video/webm",
	"video/quicktime",
]);

export const uploadLimits = {
	avatar: 2 * 1024 * 1024,
	groupIcon: 2 * 1024 * 1024,
	emoji: 1 * 1024 * 1024,
	media: 8 * 1024 * 1024,
};

export type UploadedFile = Awaited<ReturnType<FastifyRequest["file"]>>;

const contentTypesByExtension: Record<string, string> = {
	".gif": "image/gif",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
	".mp4": "video/mp4",
	".webm": "video/webm",
	".mov": "video/quicktime",
};

const safeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

export function isFileTooLarge(error: unknown): boolean {
	return error instanceof Error && error.message === "FILE_TOO_LARGE";
}

export async function storeUpload(
	file: UploadedFile,
	folder: string,
	maxSize: number,
) {
	if (!file) throw new Error("FILE_REQUIRED");
	if (file.file.truncated) throw new Error("FILE_TOO_LARGE");
	const buffer = await file.toBuffer();
	if (buffer.byteLength > maxSize) throw new Error("FILE_TOO_LARGE");
	const extension = path.extname(safeFileName(file.filename)).toLowerCase();
	const fileName = `${crypto.randomUUID()}${extension}`;
	const relativePath = path.join(folder, fileName);
	const absolutePath = path.resolve(config.STORAGE_DIR, relativePath);
	await mkdir(path.dirname(absolutePath), { recursive: true });
	await writeFile(absolutePath, buffer);
	return {
		url: `${config.PUBLIC_URL}/uploads/${relativePath.replaceAll(path.sep, "/")}`,
		contentType: file.mimetype,
	};
}

export async function readStoredFile(relativePath: string) {
	const root = path.resolve(config.STORAGE_DIR);
	const filePath = path.resolve(root, relativePath);
	if (!filePath.startsWith(`${root}${path.sep}`)) return null;
	const data = await readFile(filePath);
	const contentType =
		contentTypesByExtension[path.extname(filePath).toLowerCase()] ??
		"application/octet-stream";
	return { data, contentType };
}
