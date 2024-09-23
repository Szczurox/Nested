import { useChannel } from "context/channelContext";
import { useUser } from "context/userContext";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import SimplePeer from "simple-peer";
import { useVoice } from "context/voiceContext";
import { doc, getFirestore, updateDoc } from "firebase/firestore";
import { createFirebaseApp } from "global-utils/clientApp";

interface Peer {
	id: string;
	peer: SimplePeer.Instance;
	data?: string[];
}

const PeerAudio: React.FC<{ peer: SimplePeer.Instance }> = ({ peer }) => {
	const ref = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		console.log("I exist!");

		peer.on("stream", (stream) => {
			console.log(stream);
			ref.current!.srcObject = stream;
		});
	}, []);

	return <audio playsInline autoPlay ref={ref} />;
};

export const VoiceChannel: React.FC = ({}) => {
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const [socket, setSocket] = useState<Socket | undefined>(undefined);
	const [stream, setStream] = useState<MediaStream | undefined>(undefined);
	const [peers, setPeers] = useState<Peer[]>([]);

	const peersRef = useRef<Peer[]>([]);

	const { user } = useUser();
	const { channel } = useChannel();
	const { voice, setCurrentVoiceState } = useVoice();

	const app = createFirebaseApp();
	const db = getFirestore(app!);

	function createPeer(
		clientToSignal: string,
		callerID: string,
		stream: MediaStream
	) {
		const peer = new SimplePeer({
			initiator: true,
			trickle: false,
			stream,
			objectMode: true,
		});

		peer.on("signal", (signal) => {
			console.log(clientToSignal, callerID);
			socket!.emit("sending signal", {
				clientToSignal,
				signal,
			});
		});

		return peer;
	}

	function addPeer(
		incomingSignal: string,
		callerID: string,
		stream: MediaStream
	) {
		const peer = new SimplePeer({
			initiator: false,
			trickle: false,
			stream,
			objectMode: true,
		});

		peer.on("signal", (signal: any) => {
			console.log(incomingSignal, callerID);
			socket!.emit("returning signal", { signal, callerID });
		});

		peer.signal(incomingSignal);

		return peer;
	}

	useEffect(() => {
		if (!voice.room) return;

		const newSocket = async () => {
			setStream(
				await navigator.mediaDevices.getUserMedia({
					video: false,
					audio: true,
				})
			);

			const res = await fetch(
				`/api/get-socket-token?group=${channel.idG}&channel=${voice.room}`,
				{
					method: "get",
					headers: {
						"authorization": `${user.token}`,
					},
				}
			);

			const data = await res.json();

			const token = data.token;

			setSocket(
				io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
					auth: { token },
				})
			);
		};

		newSocket();
	}, [voice.room]);

	useEffect(() => {
		if (!socket || !stream) return;

		if (socket.connected) onConnect();

		async function updateConnected() {
			await updateDoc(
				doc(
					db,
					"groups",
					channel.idG,
					"channels",
					voice.room,
					"participants",
					user.uid
				),
				{
					connected: "connected",
				}
			);
		}

		function onConnect() {
			if (!socket) return;
			setIsConnected(true);
			setCurrentVoiceState(true, voice.muted, voice.deafened);
			updateConnected();

			let gotClients = false;

			if (gotClients == false) socket.emit("get clients");

			socket.on("all clients", (clients: string[]) => {
				gotClients = true;
				if (clients && clients.length > 0) {
					const getPeers: Peer[] = [];
					clients.forEach((clientID: string) => {
						if (clientID != socket!.id) {
							const peer = createPeer(
								clientID,
								socket!.id!,
								stream!
							);
							getPeers.push({
								id: clientID,
								peer: peer,
							});
							peersRef.current.push({
								id: clientID,
								peer,
							});
						}
					});
					setPeers(getPeers);
				}
			});

			socket.on("joined", (payload) => {
				console.log("user joined the channel");

				const peer = addPeer(payload.signal, payload.id, stream!);

				peersRef.current.push({
					id: payload.id,
					peer: peer,
				});

				console.log(peer, payload.id);

				setPeers((peers) => [...peers, { id: payload.id, peer: peer }]);
			});

			socket.on("returned signal", (payload) => {
				console.log("signaling response");
				const item = peersRef.current.find((p) => p.id === payload.id);
				if (item) item.peer.signal(payload.signal);
			});

			socket.on("left", (payload) => {
				console.log(payload, peersRef);
				const item = peersRef.current.find((p) => p.id == payload.id);
				console.log(item);
				if (item) {
					const channelPeers = [...peers];
					peersRef.current.splice(peersRef.current.indexOf(item), 1);
					channelPeers.splice(channelPeers.indexOf(item), 1);
					setPeers(channelPeers);
					item.peer.destroy();
				}
			});
		}

		function onDisconnect() {
			setIsConnected(false);
		}

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);

		return () => {
			socket.disconnect();
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			peers.forEach((peer) => {
				peer.peer.destroy();
			});
		};

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [socket, stream]);

	return (
		<div>
			{peers.map((peer) => {
				return <PeerAudio key={peer.id} peer={peer.peer} />;
			})}
		</div>
	);
};

export default VoiceChannel;
