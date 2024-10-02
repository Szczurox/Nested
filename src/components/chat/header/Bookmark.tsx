import React, { useState } from "react";
import styles from "../../../styles/components/chat/header/Bookmark.module.scss";
import CloseIcon from "@mui/icons-material/Close";
import { Avatar } from "@mui/material";
import { useRouter } from "next/router";
import { useChannel } from "context/channelContext";

export interface BookmarkData {
	id: string;
	name: string;
	guildId: string;
	guildIcon: string;
}

export interface BookmarkProps {
	id: string;
	name: string;
	guildId: string;
	guildIcon: string;
	onClose: (id: string) => void;
}

export const Bookmark: React.FC<BookmarkProps> = ({
	id,
	name,
	guildId,
	guildIcon,
	onClose,
}) => {
	const router = useRouter();

	const { channel } = useChannel();

	const [showClose, setShowClose] = useState<boolean>(false);

	return (
		<div
			className={`${styles.bookmark} ${
				channel.id == id ? styles.active : "inactive"
			}`}
			id={id}
			onMouseEnter={() => setShowClose(true)}
			onMouseLeave={() => setShowClose(false)}
		>
			<div
				className={styles.bookmark_inner}
				onClick={() =>
					router.push(`/chat/${guildId}/${id}`, undefined, {
						shallow: true,
					})
				}
			>
				<Avatar
					className={styles.avatar}
					src={guildIcon}
					sx={{ width: 24, height: 24 }}
				/>
				<p>{name}</p>
			</div>
			{showClose && (
				<div
					className={styles.close_container}
					onClick={() => onClose(id)}
				>
					<CloseIcon />
				</div>
			)}
		</div>
	);
};
