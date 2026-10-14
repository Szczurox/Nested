import React, { useRef, useState } from "react";
import styles from "@/styles/components/chat/navbar/NavbarHeader.module.scss";
import FixedMenu, { FixedMenuHandle } from "@/components/chat/contextmenu/FixedMenu";
import ContextMenuElement from "@/components/chat/contextmenu/ContextMenuElement";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import ImageIcon from "@mui/icons-material/Image";
import InputPopUp from "@/components/chat/popup/InputPopUp";
import { useChannel } from "@/context/channelContext";
import { useUser } from "@/context/userContext";
import { serverRequest } from "@/global-utils/serverClient";

export type NavbarHeaderVariant = "server" | "dms";

interface NavbarHeaderProps {
	variant?: NavbarHeaderVariant;
}

export const NavbarHeader: React.FC<NavbarHeaderProps> = ({
	variant = "server",
}) => {
	const [showPopUp, setShowPopUp] = useState<boolean>(false);
	const [showMenu, setShowMenu] = useState<boolean>(false);
	const [inviteUrl, setInviteUrl] = useState<string | null>(null);
	const [uploadingPhoto, setUploadingPhoto] = useState(false);
	const photoInputRef = useRef<HTMLInputElement>(null);

	const elementRef = useRef<HTMLDivElement>(null);
	const menuRef = useRef<FixedMenuHandle>(null);

	const { channel } = useChannel();
	const { user } = useUser();

	const changeName = async (newName: string) => {
		setShowPopUp(false);

		if (newName.replace(/\s/g, "").length) {
			await serverRequest(`/api/groups/${channel.idG}/members/${user.uid}`, {
				method: "PATCH",
				body: JSON.stringify({ nickname: newName }),
			});
		}
	};

	const createInvite = async () => {
		const { invite } = await serverRequest<{ invite: { id: string } }>(
			`/api/groups/${channel.idG}/invites`,
			{ method: "POST", body: JSON.stringify({}) }
		);
		const url = `${window.location.origin}/invite/${invite.id}?groupId=${channel.idG}`;
		setInviteUrl(url);
		await navigator.clipboard.writeText(url);
	};

	const uploadGroupPhoto = async (file: File) => {
		setUploadingPhoto(true);
		try {
			const body = new FormData();
			body.append("file", file);
			await serverRequest(`/api/groups/${channel.idG}/icon`, {
				method: "POST",
				body,
			});
			window.location.reload();
		} finally {
			setUploadingPhoto(false);
		}
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
			{inviteUrl && (
				<InputPopUp
					value={inviteUrl}
					onConfirm={() => setInviteUrl(null)}
					onCancel={() => setInviteUrl(null)}
					confirmButtonName="Done"
					allowEmpty
				>
					<h3>Invite Link Copied</h3>
					<p>Share this link with someone you want to invite.</p>
				</InputPopUp>
			)}
			<input
				ref={photoInputRef}
				type="file"
				accept="image/png,image/jpeg,image/gif,image/webp"
				hidden
				onChange={(event) => {
					const file = event.target.files?.[0];
					event.target.value = "";
					if (file) void uploadGroupPhoto(file);
				}}
			/>
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
					<ContextMenuElement type={"grey"} onClick={() => void createInvite()}>
						<LinkIcon />
						Create Invite Link
					</ContextMenuElement>
					<ContextMenuElement
						type={"grey"}
						onClick={() => photoInputRef.current?.click()}
					>
						<ImageIcon />
						{uploadingPhoto ? "Uploading Group Photo..." : "Change Group Photo"}
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
