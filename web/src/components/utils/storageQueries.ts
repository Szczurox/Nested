import { serverRequest } from "@/global-utils/serverClient";

export async function uploadAvatar(file: File) {
	const body = new FormData();
	body.append("file", file);
	return serverRequest<{ user: { avatarUrl: string | null } }>("/api/profile/avatar", {
		method: "POST",
		body,
		headers: {},
	});
}
