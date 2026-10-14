import { ChannelType } from "@/context/channelContext";
import { serverRequest } from "@/global-utils/serverClient";

export const addChannel = async (
	channelName: string,
	guild: string,
	category: string = "",
	type: ChannelType = "TEXT",
	_permissions: string[] = ["SEND_MESSAGES", "VIEW_CHANNEL"]
) => {
	await serverRequest(`/api/groups/${guild}/channels`, {
		method: "POST",
		body: JSON.stringify({
			name: channelName.replace(/\s/g, "").length ? channelName : "new-channel",
			categoryId: category || null,
			type,
		}),
	});
};
