import { useChannel } from "context/channelContext";
import { useUser } from "context/userContext";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import SimplePeer from "simple-peer";

interface Peer {
	id: string;
	peer: SimplePeer.Instance;
	data?: string[];
}

interface VoiceChannelProps {}

const PeerVideo: React.FC<{ peer: SimplePeer.Instance }> = ({ peer }) => {
	const ref = useRef<HTMLVideoElement>(null);

	const [nick, setNick] = useState<string>("");

	const { user } = useUser();

	useEffect(() => {
		console.log("I exist!");

		peer.on("stream", (stream) => {
			console.log(stream);
			ref.current!.srcObject = stream;
		});

		peer.on("connect", () => {
			if (user.serverNick) peer.send(user.serverNick as string);
			else peer.send(user.nick as string);
		});

		peer.on("data", (data) => {
			console.log(data);
			setNick(data);
		});
	}, []);

	return (
		<>
			{nick}
			<video playsInline autoPlay ref={ref} />
		</>
	);
};

export const VoiceChannel: React.FC<VoiceChannelProps> = ({}) => {
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const [socket, setSocket] = useState<Socket | undefined>(undefined);
	const [peers, setPeers] = useState<Peer[]>([]);

	const peersRef = useRef<Peer[]>([]);
	const userVideoRef = useRef<HTMLVideoElement>(null);

	const { user } = useUser();
	const { channel } = useChannel();

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
				callerID,
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
		const newSocket = async () => {
			const res = await fetch(
				`/api/get-socket-token?group=${channel.idG}&channel=${channel.id}`,
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
	}, []);

	useEffect(() => {
		if (!socket) return;

		if (socket.connected) onConnect();

		function onConnect() {
			if (!socket) return;
			setIsConnected(true);

			navigator.mediaDevices
				.getUserMedia({
					video: false,
					audio: true,
				})
				.then((stream) => {
					userVideoRef.current!.srcObject = stream;

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

						const peer = addPeer(
							payload.signal,
							payload.id,
							stream!
						);

						peersRef.current.push({
							id: payload.id,
							peer: peer,
						});

						console.log(peer, payload.id);

						setPeers((peers) => [
							...peers,
							{ id: payload.id, peer: peer },
						]);
					});

					socket.on("returned signal", (payload) => {
						console.log("signaling response");
						const item = peersRef.current.find(
							(p) => p.id === payload.id
						);
						if (item) item.peer.signal(payload.signal);
					});

					socket.on("left", (payload) => {
						console.log(payload, peersRef);
						const item = peersRef.current.find(
							(p) => p.id == payload.id
						);
						console.log(item);
						if (item) {
							const channelPeers = [...peers];
							peersRef.current.splice(
								peersRef.current.indexOf(item),
								1
							);
							channelPeers.splice(channelPeers.indexOf(item), 1);
							setPeers(channelPeers);
							item.peer.destroy();
						}
					});
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
	}, [socket]);

	return (
		<div>
			<p>Status: {isConnected ? "connected" : "disconnected"}</p>
			<video muted ref={userVideoRef} autoPlay playsInline />
			{user.serverNick ? user.serverNick : user.nick}
			{peers.map((peer) => {
				return <PeerVideo key={peer.id} peer={peer.peer} />;
			})}
		</div>
	);
};

export default VoiceChannel;
