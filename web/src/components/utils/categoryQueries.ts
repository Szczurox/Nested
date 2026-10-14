import { serverRequest } from "@/global-utils/serverClient";

export const addCategory = async (name: string, guild: string) => {
	if (name.replace(/\s/g, "").length) {
		await serverRequest(`/api/groups/${guild}/categories`, {
			method: "POST",
			body: JSON.stringify({ name }),
		});
	}
};
