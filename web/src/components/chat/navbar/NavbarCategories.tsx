import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/components/chat/navbar/NavbarCategories.module.scss";
import { CategoryData, NavbarCategory } from "./NavbarCategory";
import { ChannelData, NavbarChannel } from "./NavbarChannel";
import { createServerSocket, serverRequest } from "@/global-utils/serverClient";
import { useChannel } from "@/context/channelContext";
import ContextMenu, { ContextMenuHandle } from "@/components/chat/contextmenu/ContextMenu";
import ContextMenuElement from "@/components/chat/contextmenu/ContextMenuElement";
import AddIcon from "@mui/icons-material/Add";
import { useUser } from "@/context/userContext";
import InputPopUp from "@/components/chat/popup/InputPopUp";
import { addCategory } from "@/components/utils/categoryQueries";
import { addChannel } from "@/components/utils/channelQueries";
import { NavbarVariant } from "@/components/chat/Navbar";
import { NavbarDm } from "./NavbarDm";
import PopUpSwitch from "@/components/chat/popup/PopUpSwitch";

export interface NavbarCategoriesProps { variant?: NavbarVariant; }

export const NavbarCategories: React.FC<NavbarCategoriesProps> = ({ variant = "server" }) => {
	const [categories, setCategories] = useState<CategoryData[]>([]);
	const [nCategoryChannels, setNCategoryChannels] = useState<ChannelData[]>([]);
	const [isVoice, setIsVoice] = useState(false);
	const [showPopUp, setShowPopUp] = useState(0);
	const { channel } = useChannel();
	const { user } = useUser();
	const menuRef = useRef<ContextMenuHandle>(null);
	const elementRef = useRef<HTMLDivElement>(null);
	const channelsRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setCategories([]);
		setNCategoryChannels([]);
		if (variant !== "server" || !channel.idG || channel.idG === "@dms") return;
		Promise.all([
			serverRequest<{ categories: CategoryData[] }>(`/api/groups/${channel.idG}/categories`),
			serverRequest<{ channels: Array<ChannelData & { categoryId: string | null }> }>(
				`/api/groups/${channel.idG}/channels`
			),
		]).then(([categoryResponse, channelResponse]) => {
			setCategories(categoryResponse.categories);
			setNCategoryChannels(channelResponse.channels.filter((item) => !item.categoryId));
		}).catch((error) => console.error("Unable to load navigation", error));
	}, [channel.idG, variant]);

	useEffect(() => {
		if (variant !== "server" || !channel.idG || channel.idG === "@dms") return;
		const socket = createServerSocket();
		const refreshNavigation = () => {
			void Promise.all([
				serverRequest<{ categories: CategoryData[] }>(`/api/groups/${channel.idG}/categories`),
				serverRequest<{ channels: Array<ChannelData & { categoryId: string | null }> }>(
					`/api/groups/${channel.idG}/channels`
				),
			]).then(([categoryResponse, channelResponse]) => {
				setCategories(categoryResponse.categories);
				setNCategoryChannels(channelResponse.channels.filter((item) => !item.categoryId));
				window.dispatchEvent(new CustomEvent("nested:navigation-updated", {
					detail: { groupId: channel.idG },
				}));
			}).catch((error) => console.error("Unable to refresh navigation", error));
		};
		socket.on("connect", () => socket.emit("group.join", { groupId: channel.idG }));
		socket.on("group.category.created", refreshNavigation);
		socket.on("group.category.updated", refreshNavigation);
		socket.on("group.category.deleted", refreshNavigation);
		socket.on("group.channel.created", refreshNavigation);
		socket.on("group.channel.updated", refreshNavigation);
		socket.on("group.channel.deleted", refreshNavigation);
		socket.on("group.user.updated", (event: { groupId: string; userId: string; nickname: string }) => {
			window.dispatchEvent(new CustomEvent("nested:user-updated", { detail: event }));
		});
		return () => {
			socket.emit("group.leave", { groupId: channel.idG });
			socket.disconnect();
		};
	}, [channel.idG, variant]);

	useEffect(() => {
		const handleClick = (event: Event) => {
			if (channelsRef.current?.contains(event.target as Node)) menuRef.current?.closeMenu();
		};
		document.addEventListener("contextmenu", handleClick);
		return () => document.removeEventListener("contextmenu", handleClick);
	}, []);

	const createCategory = (name: string) => {
		setShowPopUp(0);
		void addCategory(name, channel.idG).catch((error) => console.error("Unable to create category", error));
	};
	const createChannel = (name: string) => {
		setShowPopUp(0);
		void addChannel(name, channel.idG, "", isVoice ? "VOICE" : "TEXT")
			.catch((error) => console.error("Unable to create channel", error));
	};

	return (
		<>
			{variant === "server" && user.permissions.includes("MANAGE_CHANNELS") && (
				<ContextMenu ref={menuRef} parentRef={elementRef}>
					<ContextMenuElement type="grey" onClick={() => setShowPopUp(1)}><AddIcon />Add Channel</ContextMenuElement>
					<ContextMenuElement type="grey" onClick={() => setShowPopUp(2)}><AddIcon />Add Category</ContextMenuElement>
				</ContextMenu>
			)}
			{showPopUp ? (
				<InputPopUp onConfirm={showPopUp === 1 ? createChannel : createCategory}
					onCancel={() => setShowPopUp(0)} confirmButtonName="Create"
					placeHolder={showPopUp === 1 ? "new-channel" : ""} hash={showPopUp === 1} allowEmpty>
					<h3>{showPopUp === 1 ? "Create Channel" : "Create Category"}</h3>
					{showPopUp === 1 ? <><p>Create a channel without category</p>
						<div className={styles.toggle_container}><div className={styles.toggle_text}>Text</div>
							<div className={styles.toggle}><PopUpSwitch onChange={setIsVoice} /></div>
							<div className={styles.toggle_text}>Voice</div></div></> : <p>Create a category</p>}
				</InputPopUp>
			) : null}
			<div className={styles.navbar_channels} ref={elementRef}
				onContextMenu={menuRef.current ? menuRef.current.handleContextMenu : (event) => event.preventDefault()}>
				{variant === "server" ? <div ref={channelsRef}>
					{nCategoryChannels.map(({ id, name, lastMessageAt, type }) =>
						<NavbarChannel key={id} id={id} idC="none" name={name} channelType={type} lastMessageAt={lastMessageAt} />)}
					{categories.map(({ id, name }) => <NavbarCategory key={id} idC={id} name={name} />)}
				</div> : <NavbarDm />}
			</div>
		</>
	);
};
