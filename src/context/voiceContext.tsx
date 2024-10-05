import { useState, createContext, useContext } from "react";

export type Voice = {
	connected: boolean;
	muted: boolean;
	deafened: boolean;
	room: string;
	roomName: string;
};

export interface VoiceContextType {
	voice: Voice;
	setCurrentVoiceState: (
		connected: boolean,
		muted: boolean,
		deafened: boolean
	) => void;
	setCurrentRoom: (room: string, roomName: string) => void;
}

export const VoiceContext = createContext<VoiceContextType>({
	voice: {
		connected: false,
		muted: false,
		deafened: false,
		room: "",
		roomName: "",
	},
	setCurrentVoiceState: (
		_connected: boolean,
		_muted: boolean,
		_deafened: boolean
	) => undefined,
	setCurrentRoom: (_room: string, _roomName: string) => undefined,
});

export default function VoiceContextComp({ children }: any) {
	const [voice, setVoice] = useState<Voice>({
		connected: false,
		muted: false,
		deafened: false,
		room: "",
		roomName: "",
	});

	const setCurrentVoiceState = (
		connected: boolean,
		muted: boolean = false,
		deafened: boolean = false
	) => {
		setVoice({
			...voice,
			connected: connected,
			muted: muted,
			deafened: deafened,
		});
	};

	const setCurrentRoom = (room: string, roomName: string) => {
		setVoice({
			...voice,
			room: room,
			roomName: roomName,
			connected: room == "" ? false : voice.connected,
		});
	};

	return (
		<VoiceContext.Provider
			value={{ voice, setCurrentVoiceState, setCurrentRoom }}
		>
			{children}
		</VoiceContext.Provider>
	);
}

export const useVoice = () => useContext(VoiceContext);
