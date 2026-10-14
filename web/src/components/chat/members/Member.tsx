import React, { useRef } from "react";
import styles from "@/styles/components/chat/members/Member.module.scss";
import { Avatar } from "@mui/material";
import MemberMenu from "@/components/chat/contextmenu/MemberMenu";
import ContextMenu, {
	ContextMenuHandle,
} from "@/components/chat/contextmenu/ContextMenu";

interface MemberProps {
	id: string;
	name: string;
	nameColor: string;
	avatar: string;
	isVisible: boolean;
	isActive: boolean;
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
	isActive,
}) => {
	const memberRef = useRef<HTMLDivElement | null>(null);
	const menuRef = useRef<ContextMenuHandle>(null);

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
						src={avatar || "/UserAvatar.png"}
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
