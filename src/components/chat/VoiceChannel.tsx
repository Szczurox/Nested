import {
	GridLayout,
	LiveKitRoom,
	ParticipantTile,
	RoomAudioRenderer,
	useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useChannel } from "context/channelContext";
import { useUser } from "context/userContext";
import { Track } from "livekit-client";
import { useEffect, useState } from "react";

export default function VoiceChannel() {
	const [token, setToken] = useState<string>("");

	const { user } = useUser();
	const { channel } = useChannel();

	useEffect(() => {
		(async () => {
			try {
				let resp;
				if (user.serverNick != "")
					resp = await fetch(
						`/api/get-livekit-token?room=${channel.id}&username=${user.serverNick}`,
						{ method: "GET" }
					);
				else
					resp = await fetch(
						`/api/get-livekit-token?room=${channel.id}&username=${user.nick}`,
						{ method: "GET" }
					);
				const data = await resp.json();
				setToken(data.token);
			} catch (e) {
				console.error(e);
			}
		})();
	}, [channel.id, user.serverNick, user.nick]);

	if (token === "") {
		return <div>Getting token...</div>;
	}

	return (
		<LiveKitRoom
			video={false}
			audio={true}
			token={token}
			serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
			data-lk-theme="default"
			style={{ height: "100dvh" }}
			options={{
				audioCaptureDefaults: {
					noiseSuppression: true,
					echoCancellation: true,
					latency: 150.0,
				},
			}}
		>
			<MyVideoConference />
			<RoomAudioRenderer muted={user.deafened} />
		</LiveKitRoom>
	);
}

function MyVideoConference() {
	const tracks = useTracks(
		[
			{ source: Track.Source.Camera, withPlaceholder: true },
			{ source: Track.Source.ScreenShare, withPlaceholder: false },
		],
		{ onlySubscribed: false }
	);

	return (
		<GridLayout
			tracks={tracks}
			style={{ height: "calc(100vh - var(--lk-control-bar-height))" }}
		>
			<ParticipantTile disableSpeakingIndicator />
		</GridLayout>
	);
}
