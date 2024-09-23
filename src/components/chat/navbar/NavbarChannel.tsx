import { ChannelType, useChannel } from "context/channelContext";
import React, { useEffect, useRef, useState } from "react";
import styles from "../../../styles/components/chat/navbar/NavbarChannel.module.scss";
import ContextMenu, { ContextMenuHandle } from "../contextmenu/ContextMenu";
import ContextMenuElement from "../contextmenu/ContextMenuElement";
import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getFirestore,
	onSnapshot,
	query,
	serverTimestamp,
	setDoc,
	updateDoc,
	where,
} from "firebase/firestore";
import { createFirebaseApp } from "../../../global-utils/clientApp";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import AddIcon from "@mui/icons-material/Add";
import CircleIcon from "@mui/icons-material/Circle";
import InputPopUp from "../popup/InputPopUp";
import BasicDeletePopUp from "../popup/DeletePopUp";
import { addChannel } from "components/utils/channelQueries";
import { ParticipantPermission, useUser } from "context/userContext";
import { useRouter } from "next/router";
import moment, { Moment } from "moment";
import { useVoice } from "context/voiceContext";

interface ChannelCallerData {
	id: string;
	name: string;
	avatar: string;
}

interface NavbarChannelProps {
	name: string;
	id: string;
	idC: string;
	channelType: ChannelType;
	nameC?: string;
	lastMessageAt?: number;
}

export interface ChannelData {
	id: string;
	name: string;
	createdAt: string;
	lastMessageAt: number;
	type: ChannelType;
	order: number;
}

export const NavbarChannel: React.FC<NavbarChannelProps> = ({
	name,
	id,
	idC,
	nameC = "",
	channelType = "TEXT",
	lastMessageAt,
}) => {
	const [isActive, setIsActive] = useState<boolean>(false);
	const [isUnread, setIsUnread] = useState<boolean>(false);
	const [showChannel, setShowChannel] = useState<boolean>(false);
	// Everyone permissions
	const [everyPerms, setEveryPerms] = useState<ParticipantPermission[]>([]);
	// Participant permissions
	const [partPerms, setPartPerms] = useState<ParticipantPermission[]>([]);
	const [callers, setCallers] = useState<ChannelCallerData[]>([]);
	// 0 - None  /  1 - Delete  /  2 - Change Name  /  3 - Create
	const [showPopUp, setShowPopUp] = useState<number>(0);
	const [lastActive, setLastActive] = useState<Moment>();

	const { channel, setChannelData } = useChannel();
	const { user, addPartPerms } = useUser();
	const { setCurrentRoom } = useVoice();

	const router = useRouter();

	const menuRef = useRef<ContextMenuHandle>(null);
	const elementRef = useRef<HTMLDivElement>(null);

	const app = createFirebaseApp();
	const db = getFirestore(app!);

	const participantsRef = collection(
		db,
		"groups",
		channel.idG,
		"channels",
		id,
		"participants"
	);

	const partRef = doc(participantsRef, user.uid);

	const everyoneRef = doc(
		db,
		"groups",
		channel.idG,
		"channels",
		id,
		"participants",
		"everyone"
	);

	const updateLastActive = async () => {
		await updateDoc(partRef, {
			lastActive: serverTimestamp(),
			nickname: user.serverNick ? user.serverNick : user.nick,
			avatar: user.avatar,
		});
	};

	const updateLastViewed = async () => {
		setLastActive(moment());
		await updateDoc(doc(db, "groups", channel.idG, "members", user.uid), {
			lastViewed: id,
		});
	};

	// Update currently active channel
	useEffect(() => {
		if (
			channel.id == id &&
			user.uid != "" &&
			(channel.name != name || channel.type != channelType) &&
			channelType != "VOICE"
		) {
			setIsActive(true);
			const perms = everyPerms.concat(partPerms);
			if (perms.length && perms != null && channel.id == id)
				addPartPerms(perms);
			setChannelData(id, channelType, name);
			if (channel.type != channelType) {
				updateLastViewed();
				updateLastActive();
			}
		} else if (channel.id != id) setIsActive(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [channel.id, id, user.uid, name, channel.name, channel.type]);

	// Participant data
	useEffect(() => {
		const participantSnapshot = () => {
			return onSnapshot(partRef, (doc) => {
				if (doc.exists() && doc.data()!.lastActive != null) {
					if (
						partPerms != doc.data().permissions &&
						doc.data().permissions != null
					) {
						const perms: ParticipantPermission[] = [
							...doc.data().permissions,
						];
						if (channel.id == id)
							addPartPerms(everyPerms.concat(perms));
						setEveryPerms(perms);
						setPartPerms([...doc.data().permissions]);
					}
					if (doc.data()!.lastViewed < lastMessageAt!)
						setIsUnread(true);
					else setIsUnread(false);
				}
			});
		};

		const everyoneSnapshot = () => {
			return onSnapshot(everyoneRef, (doc) => {
				if (doc.exists()) {
					const perms: ParticipantPermission[] = [
						...doc.data().permissions,
					];
					if (channel.id == id) addPartPerms(partPerms.concat(perms));
					setEveryPerms(perms);
				}
			});
		};

		async function checkParticipant() {
			const participantDoc = await getDoc(partRef);
			if (
				participantDoc.exists() &&
				participantDoc.data().nickname == user.serverNick
			) {
				return participantSnapshot();
			} else {
				await setDoc(partRef, {
					lastActive: serverTimestamp(),
					nickname: user.serverNick ? user.serverNick : user.nick,
				});
				return participantSnapshot();
			}
		}

		const unsub = everyoneSnapshot();

		checkParticipant().then((res) => {
			return () => {
				res();
				unsub();
			};
		});

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user.uid, id]);

	useEffect(() => {
		if (channelType != "VOICE") return;

		async function connectedSnapshot() {
			const partQuery = query(
				participantsRef,
				where("connected", "==", "connected")
			);
			return onSnapshot(partQuery, (snap) => {
				snap.docChanges().forEach((change) => {
					if (
						change.type === "removed" ||
						change.type === "modified"
					) {
						setCallers((callers) =>
							[
								...callers.filter(
									(el) => el.id !== change.doc.id
								),
							].sort((x, y) => {
								return x.name > y.name ? 1 : -1;
							})
						);
					}
					if (change.type === "added" || change.type === "modified") {
						setCallers((callers) =>
							[
								...callers.filter(
									(el) => el.id !== change.doc.id
								),
								{
									id: change.doc.id,
									name: change.doc.data().nickname,
									avatar: change.doc.data().avatar,
								},
							].sort((x, y) => {
								return x.name > y.name ? 1 : -1;
							})
						);
					}
				});
			});
		}

		connectedSnapshot();
	}, []);

	// Check if user can display channel
	useEffect(() => {
		if (
			everyPerms.includes("VIEW_CHANNEL") ||
			partPerms.includes("VIEW_CHANNEL")
		)
			setShowChannel(true);
		else setShowChannel(false);
	}, [everyPerms, partPerms]);

	const deleteChannel = async () => {
		// It won't actually delete the channel, it's subcollections (messages) will still exist
		// Because of that for now inactive channels will need to get deleted manually using the CLI or console
		// TODO: Server side function for deleting all channel's messages (performance issues if on client)
		const channelDoc = doc(db, "groups", channel.idG, "channels", id);

		setShowPopUp(0);

		// Kick user out of the channel so that messages can't be seen anymore
		if (channel.id == id) setChannelData("", "TEXT", "");

		await deleteDoc(channelDoc);
	};

	const changeChannelName = async (newName: string) => {
		if (newName != name && newName.replace(/\s/g, "").length) {
			const channelDoc = doc(db, "groups", channel.idG, "channels", id);

			setShowPopUp(0);

			await updateDoc(channelDoc, {
				name: newName,
			});
		}
	};

	const createChannel = async (channelName: string = "") => {
		setShowPopUp(0);
		await addChannel(channelName, channel.idG, idC);
	};

	const handleChannelJoin = () => {
		setCurrentRoom(id, name);
	};

	return showChannel ? (
		<>
			<ContextMenu ref={menuRef} parentRef={elementRef}>
				<ContextMenuElement
					type={"grey"}
					onClick={(_) => updateLastActive()}
				>
					<VisibilityIcon />
					Mark As Read
				</ContextMenuElement>
				{user.permissions.includes("MANAGE_CHANNELS") ? (
					<>
						<ContextMenuElement
							type={"grey"}
							onClick={(_) => setShowPopUp(2)}
						>
							<EditIcon />
							Change Channel Name
						</ContextMenuElement>
						<ContextMenuElement
							type={"grey"}
							onClick={(_) => setShowPopUp(3)}
						>
							<AddIcon />
							Create Channel
						</ContextMenuElement>
						<ContextMenuElement
							type={"red"}
							onClick={(_) => setShowPopUp(1)}
						>
							<DeleteIcon />
							Delete Channel
						</ContextMenuElement>
					</>
				) : null}
				<ContextMenuElement
					type={"grey"}
					onClick={(_) => navigator.clipboard.writeText(id)}
				>
					<ContentCopyIcon />
					Copy Channel ID
				</ContextMenuElement>
			</ContextMenu>

			{showPopUp ? (
				showPopUp == 1 ? (
					<BasicDeletePopUp
						onCancel={() => setShowPopUp(0)}
						onConfirm={deleteChannel}
					>
						<h3>Delete Channel</h3>
						<p>Are you sure u want to delete #{name} channel?</p>
					</BasicDeletePopUp>
				) : (
					<InputPopUp
						onConfirm={
							showPopUp == 3 ? createChannel : changeChannelName
						}
						onCancel={() => setShowPopUp(0)}
						confirmButtonName={
							showPopUp == 3 ? "Create" : "Confirm"
						}
						value={showPopUp == 3 ? "" : name}
						placeHolder={showPopUp == 3 ? "new-channel" : name}
						hash={true}
						allowEmpty={true}
					>
						<h3>
							{showPopUp == 3
								? "Create Channel"
								: "Change Channel Name"}
						</h3>
						{showPopUp == 3 ? (
							<p>Create channel in {nameC}</p>
						) : (
							<p>Change name for #{name}</p>
						)}
					</InputPopUp>
				)
			) : null}

			<div
				className={
					channelType == "TEXT"
						? isActive
							? `${styles.channel} ${styles.active}`
							: isUnread
							? `${styles.channel} ${styles.unread}`
							: `${styles.channel} ${styles.inactive}`
						: `${styles.channel} ${styles.inactive}`
				}
				id={id}
				onClick={() =>
					channelType == "TEXT"
						? router.push(`/chat/${channel.idG}/${id}`, undefined, {
								shallow: true,
						  })
						: handleChannelJoin()
				}
				onContextMenu={(e) => menuRef.current?.handleContextMenu(e)}
				ref={elementRef}
			>
				<h4>
					{isUnread && <CircleIcon className={styles.unread_dot} />}
					{channelType == "VOICE" ? (
						<span className={styles.volume}>
							<VolumeUpIcon />
						</span>
					) : (
						<span className={styles.hash}>#</span>
					)}
					<div className={styles.channel_name}>{name}</div>
				</h4>
				{callers.map((caller) => (
					<p key={caller.id}>{caller.name}</p>
				))}
			</div>
		</>
	) : null;
};
