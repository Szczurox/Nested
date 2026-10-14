import { useState, createContext, useContext } from "react";

export type ChannelType = "VOICE" | "TEXT" | "LOADING";

export type Channel = {
	id: string; // Channel ID
	name: string; // Channel name
	idG: string; // Group ID
	nameG: string; // Group name
	icon: string; // Group icon
	type: ChannelType; // Channel type
	bookmarked: boolean; // Is channel bookmarked
};

export interface ChannelContextType {
	channel: {
		id: string; // Channel ID
		name: string; // Channel name
		idG: string; // Group ID
		nameG: string; // Group name
		icon: string; // Group icon
		type: ChannelType; // Channel type
		bookmarked: boolean; // Is channel bookmarked
	};
	setChannelData: (
		id: string,
		type: ChannelType,
		name?: string,
		bookmark?: boolean
	) => void;
	setGroupData: (
		idG: string,
		id?: string,
		name?: string,
		icon?: string
	) => void;
	setBookmark: (bookmark: boolean) => void;
}

export const ChannelContext = createContext<ChannelContextType>({
	channel: {
		id: "",
		name: "",
		idG: "",
		nameG: "",
		icon: "",
		type: "TEXT",
		bookmarked: false,
	},
	setChannelData: (
		_id: string,
		_type: ChannelType,
		_name?: string,
		_bookmark?: boolean
	) => undefined,
	setGroupData: (
		_idG: string,
		_id?: string,
		_name?: string,
		_icon?: string
	) => undefined,
	setBookmark: (_bookmark: boolean) => undefined,
});

export default function ChannelContextComp({ children }: any) {
	const [channel, setChannel] = useState<Channel>({
		id: "",
		name: "",
		idG: "@dms",
		icon: "",
		nameG: "Direct Messages",
		type: "LOADING",
		bookmarked: false,
	});

	const setChannelData = (
		id: string,
		type: ChannelType,
		name?: string,
		bookmarked?: boolean
	) => {
		setChannel({
			...channel,
			id: id,
			type: type,
			name: name ? name : channel.name,
			bookmarked:
				bookmarked != undefined ? bookmarked : channel.bookmarked,
		});
	};

	const setGroupData = (
		idG: string,
		id?: string,
		name?: string,
		icon?: string
	) => {
		setChannel({
			...channel,
			id: id ? id : channel.id,
			idG: idG,
			nameG: name ? name : channel.nameG,
			type: "LOADING",
			icon: icon ? icon : channel.icon,
		});
	};

	const setBookmark = (bookmark: boolean) => {
		setChannel({
			...channel,
			bookmarked: bookmark,
		});
	};

	return (
		<ChannelContext.Provider
			value={{ channel, setChannelData, setGroupData, setBookmark }}
		>
			{children}
		</ChannelContext.Provider>
	);
}

export const useChannel = () => useContext(ChannelContext);
