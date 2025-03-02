import React, { useRef, useState } from "react";
import styles from "../../../styles/components/chat/navbar/NavbarHeader.module.scss";
import FixedMenu, { FixedMenuHandle } from "../contextmenu/FixedMenu";
import ContextMenuElement from "../contextmenu/ContextMenuElement";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditIcon from "@mui/icons-material/Edit";
import InputPopUp from "../popup/InputPopUp";
import { useChannel } from "context/channelContext";
import { useUser } from "context/userContext";
import { createFirebaseApp } from "../../../global-utils/clientApp";
import { doc, getFirestore, updateDoc } from "firebase/firestore";

export type NavbarHeaderVariant = "server" | "dms";

interface NavbarHeaderProps {
	variant?: NavbarHeaderVariant;
}

export const NavbarHeader: React.FC<NavbarHeaderProps> = ({
	variant = "server",
}) => {
	const [showPopUp, setShowPopUp] = useState<boolean>(false);
	const [showMenu, setShowMenu] = useState<boolean>(false);

	const elementRef = useRef<HTMLDivElement>(null);
	const menuRef = useRef<FixedMenuHandle>(null);

	const { channel } = useChannel();
	const { user } = useUser();

	const app = createFirebaseApp();
	const db = getFirestore(app!);

	const changeName = async (newName: string) => {
		setShowPopUp(false);

		const memberDoc = doc(db, "groups", channel.idG, "members", user.uid);

		if (newName.replace(/\s/g, "").length)
			await updateDoc(memberDoc, {
				nickname: newName,
			});
	};

	return variant === "server" ? (
		<>
			{showPopUp && (
				<InputPopUp
					onConfirm={changeName}
					onCancel={() => setShowPopUp(false)}
					confirmButtonName={"Confirm"}
					value={user.serverNick}
					placeHolder={user.serverNick}
				>
					<h3>{"Change Group Nickname"}</h3>
					<p>Change nickname on this group</p>
				</InputPopUp>
			)}
			<div
				className={styles.sidebar_header}
				onClick={(e) =>
					menuRef.current
						? !menuRef.current.isOpen()
							? menuRef.current!.openMenu(e)
							: menuRef.current.closeMenu()
						: null
				}
				ref={elementRef}
			>
				<FixedMenu
					menuPoint={{ x: 95, y: 62 }}
					parentRef={elementRef}
					ref={menuRef}
					isTop={true}
					isLeft={true}
					className={styles.header_menu}
					onOpen={() => setShowMenu(true)}
					onClose={() => setShowMenu(false)}
				>
					<ContextMenuElement
						type={"grey"}
						onClick={(_) => setShowPopUp(true)}
					>
						<EditIcon />
						Change Nickname
					</ContextMenuElement>
					<ContextMenuElement
						type={"grey"}
						onClick={(_) =>
							navigator.clipboard.writeText(channel.idG)
						}
					>
						<ContentCopyIcon />
						Copy Group ID
					</ContextMenuElement>
				</FixedMenu>
				<h3>{channel.nameG}</h3>
				{showMenu ? <ExpandLessIcon /> : <ExpandMoreIcon />}
			</div>
		</>
	) : (
		<div className={styles.sidebar_header_search}>
			<div className={styles.sidebar_header_input}>
				<input placeholder="Search" />
			</div>
		</div>
	);
};
