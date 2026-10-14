import { io, Socket } from "socket.io-client";

export type ServerUser = {
	id: string;
	username: string;
	nickname: string;
	avatarUrl: string | null;
	createdAt: string;
};

const serverUrl = (
	process.env.NEXT_PUBLIC_SERVER_URL ??
	process.env.NEXT_PUBLIC_SOCKET_URL ??
	"http://localhost:4000"
).replace(/\/+$/, "");

export async function serverRequest<T>(
	path: string,
	options: RequestInit = {}
): Promise<T> {
	const normalizedPath = `/${path.replace(/^\/+/, "")}`;
	const hasBody = options.body !== undefined;
	const response = await fetch(`${serverUrl}${normalizedPath}`, {
		...options,
		credentials: "include",
		headers: {
			...(hasBody && !(options.body instanceof FormData)
				? { "content-type": "application/json" }
				: {}),
			...(options.headers ?? {}),
		},
	});

	if (!response.ok) {
		let message = `Request failed with status ${response.status}`;
		try {
			const body = (await response.json()) as { message?: string; error?: string };
			message = body.message ?? body.error ?? message;
		} catch {
			// Preserve the HTTP status when the server returned no JSON body.
		}
		const error = new Error(message) as Error & { status?: number; code?: string };
		error.status = response.status;
		throw error;
	}

	if (response.status === 204) return undefined as T;
	return response.json() as Promise<T>;
}

export function createServerSocket(): Socket {
	return io(serverUrl, { withCredentials: true });
}

export function toClientUser(user: ServerUser) {
	return {
		token: "",
		uid: user.id,
		username: user.username,
		avatar: user.avatarUrl ?? "/UserAvatar.png",
		nick: user.nickname,
		serverNick: "",
		verified: true,
		lastActive: Date.now(),
		permissions: [],
		partPermissions: [],
	};
}
