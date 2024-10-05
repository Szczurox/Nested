import React, { useEffect, useState } from "react";
// import NotificationsIcon from "@mui/icons-material/Notifications";
// import EditLocationRoundedIcon from "@mui/icons-material/EditLocationRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import MenuIcon from "@mui/icons-material/Menu";
import MarkunreadMailboxRoundedIcon from "@mui/icons-material/MarkunreadMailboxRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import useMediaQuery from "@mui/material/useMediaQuery";
import styles from "../../styles/components/chat/ChatHeader.module.scss";
import Link from "next/link";
import { useChannel } from "context/channelContext";
import { NavbarVariant } from "./Navbar";
import { Bookmark, BookmarkData } from "./header/Bookmark";

interface ChatHeaderProps {
	isNavbarOpen: boolean;
	isMembersOpen: boolean;
	variant: NavbarVariant;
	onMembers: (query?: string) => void;
	setShowNavbar: (show: boolean) => void;
	onBookmarks: (show: boolean) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
	isNavbarOpen,
	isMembersOpen,
	variant,
	onMembers,
	setShowNavbar,
	onBookmarks,
}) => {
	const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);

	const { channel, setBookmark } = useChannel();

	const isMobile = useMediaQuery("(pointer: none), (pointer: coarse)");

	const onBookmark = (add: boolean, id: string = "") => {
		if (id == channel.id || !id) setBookmark(add);
		if (add) {
			if (!bookmarks) onBookmark(true);
			setBookmarks((bookmarks) => [
				{
					id: channel.id,
					name: channel.name,
					guildId: channel.idG,
					guildIcon: channel.icon,
				},
				...bookmarks,
			]);
		}
		if (!add)
			setBookmarks((bookmarks) => [
				...bookmarks.filter((el) =>
					id ? el.id !== id : el.id !== channel.id
				),
			]);
	};

	useEffect(() => {
		onBookmarks(bookmarks.length > 0);
	}, [bookmarks]);

	useEffect(() => {
		if (channel.type == "TEXT") {
			if (
				bookmarks.find((el) => el.id == channel.id) &&
				!channel.bookmarked
			)
				setBookmark(true);
			else if (
				!bookmarks.find((el) => el.id == channel.id) &&
				channel.bookmarked
			)
				setBookmark(false);
		}
	}, [channel.id, channel.type]);

	return (
		<div className={styles.shadow}>
			{bookmarks.length > 0 && variant != "dms" && (
				<div className={styles.bookmarks}>
					{bookmarks.map((bookmark) => (
						<Bookmark
							id={bookmark.id}
							key={bookmark.id}
							name={bookmark.name}
							guildId={bookmark.guildId}
							guildIcon={bookmark.guildIcon}
							onClose={(id) => onBookmark(false, id)}
						/>
					))}
				</div>
			)}
			<div
				className={
					isNavbarOpen
						? `${styles.chat_header} ${styles.chat_header_navbar_open}`
						: isMembersOpen
						? `${styles.chat_header} ${styles.chat_header_members_open}`
						: styles.chat_header
				}
			>
				{isMobile ? (
					<div className={styles.chat_header_menu_icon}>
						<MenuIcon
							onClick={(_) => setShowNavbar(!isNavbarOpen)}
						/>
					</div>
				) : null}
				<div className={styles.chat_header_left}>
					<h3>
						<span className={styles.chat_header_hash}>#</span>
						{channel.type != "LOADING" && channel.name}
					</h3>
				</div>
				{variant != "dms" ? (
					<div className={styles.chat_header_right}>
						{channel.bookmarked ? (
							<BookmarkIcon
								onClick={(_) => onBookmark(false)}
								className={styles.chat_header_bookmark}
							/>
						) : (
							<BookmarkBorderIcon
								onClick={(_) => onBookmark(true)}
								className={styles.chat_header_bookmark}
							/>
						)}
						{/*<NotificationsIcon />
						<EditLocationRoundedIcon />*/}
						<PeopleAltRoundedIcon
							onClick={(_) => onMembers()}
							className={styles.chat_header_people}
						/>

						<div className={styles.chat_header_search}>
							<input
								placeholder="Search"
								onChange={(e) => onMembers(e.target.value)}
							/>
							<SearchRoundedIcon />
						</div>
						<Link href="/dev">
							<MarkunreadMailboxRoundedIcon />
						</Link>
						<a
							href="https://github.com/Szczurox/Nested/"
							target="_blank"
							rel="noreferrer"
						>
							<HelpRoundedIcon />
						</a>
					</div>
				) : null}
			</div>
		</div>
	);
};

export default ChatHeader;
