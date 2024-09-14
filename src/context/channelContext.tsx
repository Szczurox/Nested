import { useState, createContext, useContext } from "react";

export type ChannelType = "VOICE" | "TEXT" | "LOADING";

export type Channel = {
	id: string; // Channel ID
	name: string; // Channel name
	idG: string; // Group ID
	nameG: string; // Group name
	type: ChannelType; // Channel type
};

export interface ChannelContextType {
	channel: {
		id: string; // Channel ID
		name: string; // Channel name
		idG: string; // Group ID
		nameG: string; // Group name
		type: ChannelType; // Channel type
	};
	setChannelData: (id: string, type: ChannelType, name?: string) => void;
	setGroupData: (idG: string, id?: string, name?: string) => void;
}

export const ChannelContext = createContext<ChannelContextType>({
	channel: {
		id: "",
		name: "",
		idG: "",
		nameG: "",
		type: "TEXT",
	},
	setChannelData: (_id: string, _type: ChannelType, _name?: string) =>
		undefined,
	setGroupData: (_idG: string, _id?: string, _name?: string) => undefined,
});

export default function ChannelContextComp({ children }: any) {
	const [channel, setChannel] = useState<Channel>({
		id: "",
		name: "",
		idG: "@dms",
		nameG: "Direct Messages",
		type: "LOADING",
	});

	const setChannelData = (id: string, type: ChannelType, name?: string) => {
		setChannel({
			id: id,
			type: type,
			name: name ? name : channel.name,
			idG: channel.idG,
			nameG: channel.nameG,
		});
	};

	const setGroupData = (idG: string, id?: string, name?: string) => {
		setChannel({
			id: id ? id : channel.id,
			name: channel.name,
			idG: idG,
			nameG: name ? name : channel.nameG,
			type: "LOADING",
		});
	};

	return (
		<ChannelContext.Provider
			value={{ channel, setChannelData, setGroupData }}
		>
			{children}
		</ChannelContext.Provider>
	);
}

export const useChannel = () => useContext(ChannelContext);
