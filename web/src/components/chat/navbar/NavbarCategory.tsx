import React, { useEffect, useRef, useState } from "react";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import styles from "@/styles/components/chat/navbar/NavbarCategory.module.scss";
import { ChannelData, NavbarChannel } from "./NavbarChannel";
import { serverRequest } from "@/global-utils/serverClient";
import { useUser } from "@/context/userContext";
import { useChannel } from "@/context/channelContext";
import InputPopUp from "@/components/chat/popup/InputPopUp";
import ContextMenuElement from "@/components/chat/contextmenu/ContextMenuElement";
import ContextMenu, { ContextMenuHandle } from "@/components/chat/contextmenu/ContextMenu";
import DeletePopUp from "@/components/chat/popup/DeletePopUp";
import { addChannel } from "@/components/utils/channelQueries";
import PopUpSwitch from "@/components/chat/popup/PopUpSwitch";

export type NavbarCategoryVariant = "server" | "dms";

interface NavbarCategoryProps {
	idC: string;
	variant?: NavbarCategoryVariant;
	name: string;
}

export interface CategoryData {
	id: string;
	name: string;
	createdAt: string;
}

export const NavbarCategory: React.FC<NavbarCategoryProps> = ({
	idC,
	name,
	variant = "server",
}) => {
	const [showChannels, setShowChannels] = useState<boolean>(true);
	const [isVoice, setIsVoice] = useState<boolean>(false);
	const [showPopUp, setShowPopUp] = useState<number>(0);
	const [channels, setChannels] = useState<ChannelData[]>([]);

	const { user } = useUser();
	const { channel } = useChannel();

	const menuRef = useRef<ContextMenuHandle>(null);
	const elementRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!channel.idG || channel.idG === "@dms") return;
		serverRequest<{ channels: ChannelData[] }>(
			`/api/groups/${channel.idG}/channels`,
		)
			.then(({ channels: allChannels }) =>
				setChannels(
					allChannels.filter((item) => item.categoryId === idC),
				),
			)
			.catch((error) =>
				console.error("Unable to load category channels", error),
			);
	}, [idC, channel.idG]);

	useEffect(() => {
		const refresh = (event: Event) => {
			const detail = (event as CustomEvent<{ groupId: string }>).detail;
			if (detail.groupId !== channel.idG) return;
			serverRequest<{ channels: ChannelData[] }>(
				`/api/groups/${channel.idG}/channels`,
			)
				.then(({ channels: allChannels }) =>
					setChannels(
						allChannels.filter((item) => item.categoryId === idC),
					),
				)
				.catch((error) =>
					console.error("Unable to refresh category channels", error),
				);
		};
		window.addEventListener("nested:navigation-updated", refresh);
		return () =>
			window.removeEventListener("nested:navigation-updated", refresh);
	}, [channel.idG, idC]);

	const createChannel = async (channelName: string) => {
		setShowPopUp(0);
		await addChannel(
			channelName,
			channel.idG,
			idC,
			isVoice ? "VOICE" : "TEXT",
		);
	};

	const changeCategoryName = async (newName: string) => {
		if (newName != name && newName.replace(/\s/g, "").length) {
			setShowPopUp(0);
			await serverRequest(
				`/api/groups/${channel.idG}/categories/${idC}`,
				{
					method: "PATCH",
					body: JSON.stringify({ name: newName }),
				},
			);
		}
	};

	const deleteCategory = async () => {
		setShowPopUp(0);

		await serverRequest(`/api/groups/${channel.idG}/categories/${idC}`, {
			method: "DELETE",
		});
	};

	return (
		<>
			<ContextMenu ref={menuRef} parentRef={elementRef}>
				{user.permissions.includes("MANAGE_CHANNELS") ? (
					<>
						<ContextMenuElement
							type={"grey"}
							onClick={(_) => setShowPopUp(2)}
						>
							<EditIcon />
							Change Category Name
						</ContextMenuElement>
						<ContextMenuElement
							type={"red"}
							onClick={(_) => setShowPopUp(3)}
						>
							<DeleteIcon />
							Delete Category
						</ContextMenuElement>
					</>
				) : null}
				<ContextMenuElement
					type={"grey"}
					onClick={(_) => navigator.clipboard.writeText(idC)}
				>
					<ContentCopyIcon />
					Copy Category ID
				</ContextMenuElement>
			</ContextMenu>

			{showPopUp ? (
				showPopUp == 3 ? (
					<DeletePopUp
						onCancel={() => setShowPopUp(0)}
						onConfirm={deleteCategory}
					>
						<h3>Delete Category</h3>
						<p>Are you sure u want to delete {name} category?</p>
					</DeletePopUp>
				) : (
					<InputPopUp
						onConfirm={
							showPopUp == 1 ? createChannel : changeCategoryName
						}
						onCancel={() => setShowPopUp(0)}
						confirmButtonName={
							showPopUp == 1 ? "Create" : "Confirm"
						}
						value={showPopUp == 1 ? "" : name}
						placeHolder={showPopUp == 1 ? "new-channel" : name}
						hash={true}
						allowEmpty={true}
					>
						<h3>
							{showPopUp == 1
								? "Create Channel"
								: "Change Category Name"}
						</h3>
						{showPopUp == 1 ? (
							<>
								<p>Create a channel in {name}</p>
								<div className={styles.toggle_container}>
									<div className={styles.toggle_text}>
										Text
									</div>
									<div className={styles.toggle}>
										<PopUpSwitch
											onChange={(isOn) =>
												setIsVoice(isOn)
											}
										/>
									</div>
									<div className={styles.toggle_text}>
										Voice
									</div>
								</div>
							</>
						) : (
							<p>Change name for {name}</p>
						)}
					</InputPopUp>
				)
			) : null}

			<div className={styles.navbar_category} id={idC}>
				<div
					className={styles.navbar_channels_header}
					onContextMenu={
						menuRef.current!
							? menuRef.current!.handleContextMenu
							: () => null
					}
					ref={elementRef}
				>
					{variant === "server" ? (
						<div
							className={styles.navbar_header}
							onClick={() => setShowChannels(!showChannels)}
						>
							{showChannels ? (
								<ExpandMoreIcon />
							) : (
								<ExpandLessIcon />
							)}
							<h4>{name}</h4>
						</div>
					) : (
						<div className={styles.navbar_header}>
							<h4>DIRECT MESSAGES</h4>
						</div>
					)}
					{user.permissions.includes("MANAGE_CHANNELS") ? (
						<AddIcon
							className={styles.navbar_add_channel}
							onClick={(_) => setShowPopUp(1)}
						/>
					) : null}
				</div>
				<div
					className="navbar_channels"
					style={{
						height: showChannels ? "auto" : "0px",
						visibility: showChannels ? "visible" : "hidden",
					}}
				>
					{channels.map((channel) => (
						<NavbarChannel
							key={channel.id}
							id={channel.id}
							idC={idC}
							name={channel.name}
							nameC={name}
							channelType={channel.type}
							lastMessageAt={channel.lastMessageAt}
						/>
					))}
				</div>
			</div>
		</>
	);
};
