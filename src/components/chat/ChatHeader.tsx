import React from "react";
// import NotificationsIcon from "@mui/icons-material/Notifications";
// import EditLocationRoundedIcon from "@mui/icons-material/EditLocationRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MenuIcon from "@mui/icons-material/Menu";
import MarkunreadMailboxRoundedIcon from "@mui/icons-material/MarkunreadMailboxRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import useMediaQuery from "@mui/material/useMediaQuery";
import styles from "../../styles/components/chat/ChatHeader.module.scss";
import { useChannel } from "context/channelContext";
import { NavbarVariant } from "./Navbar";
import Link from "next/link";

interface ChatHeaderProps {
	isNavbarOpen: boolean;
	isMembersOpen: boolean;
	variant: NavbarVariant;
	onMembers: (query?: string) => void;
	setShowNavbar: (show: boolean) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
	isNavbarOpen,
	isMembersOpen,
	variant,
	onMembers,
	setShowNavbar,
}) => {
	const { channel } = useChannel();

	const isMobile = useMediaQuery("(pointer: none), (pointer: coarse)");

	return (
		<div className={styles.shadow}>
			<div
				className={
					isNavbarOpen
						? `${styles.chatHeader} ${styles.chatHeader_navbar_open}`
						: isMembersOpen
						? `${styles.chatHeader} ${styles.chatHeader_members_open}`
						: styles.chatHeader
				}
			>
				{isMobile ? (
					<div className={styles.chatHeader_menu_icon}>
						<MenuIcon
							onClick={(_) => setShowNavbar(!isNavbarOpen)}
						/>
					</div>
				) : null}
				<div className={styles.chatHeader_left}>
					<h3>
						<span className={styles.chatHeader_hash}>#</span>
						{channel.type != "LOADING" && channel.name}
					</h3>
				</div>
				{variant != "dms" ? (
					<div className={styles.chatHeader_right}>
						{/*<NotificationsIcon />
						<EditLocationRoundedIcon />*/}
						<PeopleAltRoundedIcon
							onClick={(_) => onMembers()}
							className={styles.chatHeader_people}
						/>

						<div className={styles.chatHeader_search}>
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
