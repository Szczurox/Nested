import React, { useEffect, useRef, useState } from "react";
import styles from "../../../styles/components/chat/members/Member.module.scss";
import { Avatar } from "@mui/material";
import { doc, getFirestore, onSnapshot } from "firebase/firestore";
import { createFirebaseApp } from "../../../global-utils/clientApp";
import moment, { Moment } from "moment";
import { useUser } from "context/userContext";
import { useChannel } from "context/channelContext";
import MemberMenu from "../contextmenu/MemberMenu";
import ContextMenu, { ContextMenuHandle } from "../contextmenu/ContextMenu";

interface MemberProps {
	id: string;
	name: string;
	nameColor: string;
	avatar: string;
	isVisible: boolean;
	changeActivity: (id: string, active: boolean) => void;
}

export interface MemberData {
	id: string;
	name: string;
	nameColor: string;
	avatar: string;
}

export const Member: React.FC<MemberProps> = ({
	id,
	name,
	nameColor,
	avatar,
	isVisible,
	changeActivity,
}) => {
	const memberRef = useRef<HTMLDivElement>(null);
	const menuRef = useRef<ContextMenuHandle>(null);

	const { channel } = useChannel();
	const { user } = useUser();

	const [trueAvatar, setTrueAvatar] = useState<string>(avatar);
	const [isActive, setIsActive] = useState<boolean>(
		id == user.uid ? true : false
	);
	const [lastActive, setLastActive] = useState<Moment>();

	const app = createFirebaseApp();
	const db = getFirestore(app!);

	useEffect(() => {
		setTrueAvatar(avatar);
	}, [avatar]);

	useEffect(() => {
		function onMemberLoad() {
			if (id != user.uid)
				return onSnapshot(doc(db, "profile", id), (doc) => {
					if (doc.exists()) {
						if (avatar == "" && doc.data().avatar)
							setTrueAvatar(doc.data().avatar);
						if (doc.data().lastActive) {
							const active = moment(
								doc.data().lastActive.toMillis()
							)
								.add(3, "m")
								.isAfter(moment());
							changeActivity(id, active);
							setLastActive(
								moment(doc.data().lastActive.toMillis()).add(
									3,
									"m"
								)
							);
							setIsActive(active);
						}
					}
				});
			else {
				changeActivity(id, true);
				if (!avatar) setTrueAvatar(user.avatar);
				return () => {
					return;
				};
			}
		}

		const unsub = onMemberLoad();
		return () => unsub();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [channel.idG]);

	useEffect(() => {
		const interval = setInterval(async () => {
			if (id == user.uid) setIsActive(true);
			else if (lastActive) {
				const activity = lastActive.isAfter(moment());
				if (activity != isActive) {
					changeActivity(id, activity);
					setIsActive(activity);
				}
			} else setIsActive(false);
		}, 1500);

		return () => clearInterval(interval);
	});

	return (
		<>
			<div
				className={styles.member}
				id={id}
				style={{ display: !isVisible ? "none" : undefined }}
				ref={memberRef}
				onContextMenu={(e) => menuRef.current?.handleContextMenu(e)}
			>
				<div className={styles.member_avatar}>
					<Avatar
						style={{ height: "45px", width: "45px" }}
						src={trueAvatar ? trueAvatar : "/UserAvatar.png"}
					/>
				</div>
				<h4 style={{ color: nameColor ? nameColor : "white" }}>
					{name}
				</h4>{" "}
				<span className={styles.member_activity_background} />
				<span
					className={styles.member_activity}
					style={{ backgroundColor: isActive ? "#00ff40" : "grey" }}
				/>
			</div>
			<ContextMenu ref={menuRef} parentRef={memberRef}>
				<MemberMenu uid={id} />
			</ContextMenu>
		</>
	);
};
