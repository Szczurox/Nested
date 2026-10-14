import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/components/chat/ui-icons/Emoji.module.scss";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import FixedMenu, {
	FixedMenuHandle,
} from "@/components/chat/contextmenu/FixedMenu";
import { useChannel } from "@/context/channelContext";
import { serverRequest } from "@/global-utils/serverClient";
import Image from "next/image";
import { useUser } from "@/context/userContext";
import Add from "@mui/icons-material/Add";
import UploadFilePopUp from "@/components/chat/popup/UploadFilePopUp";
import InformationPopUp from "@/components/chat/popup/InformationPopUp";

export interface EmojiData {
	id: string;
	file: string;
	name: string;
	createdAt: number;
}

interface EmojiProps {
	enabled: boolean;
	isBookmarked: boolean;
	emojiAdded: (text: string, file: string) => void;
}

const Emoji: React.FC<EmojiProps> = ({ enabled, isBookmarked, emojiAdded }) => {
	const [emoji, setEmoji] = useState<EmojiData[]>([]);
	const [adding, setAdding] = useState(false);
	const [fileUrl, setFileUrl] = useState("");
	const [fileG, setFileG] = useState<File>();
	const [isTooLarge, setIsTooLarge] = useState(false);
	const [isWrongType, setIsWrongType] = useState(false);
	const [curEmoji, setCurEmoji] = useState<EmojiData>();
	const { channel } = useChannel();
	const { user } = useUser();
	const menuRef = useRef<FixedMenuHandle>(null);
	const elementRef = useRef<HTMLSpanElement | null>(null);

	useEffect(() => {
		if (!channel.idG || channel.idG === "@dms") return;
		serverRequest<{
			emojis: Array<{
				id: string;
				name: string;
				fileUrl: string;
				createdAt: string;
			}>;
		}>(`/api/groups/${channel.idG}/emojis`)
			.then(({ emojis }) =>
				setEmoji(
					emojis.map((item) => ({
						id: item.id,
						name: item.name,
						file: item.fileUrl,
						createdAt: Date.parse(item.createdAt),
					})),
				),
			)
			.catch((error) => console.error("Unable to load emoji", error));
	}, [channel.idG]);

	const emojiClicked = (event: React.MouseEvent, data: EmojiData) => {
		event.preventDefault();
		setCurEmoji(undefined);
		emojiAdded(`<:${data.name}?${channel.idG}:>`, data.file);
		if (!event.shiftKey) menuRef.current?.closeMenu();
	};

	const checkFile = (file: File) => {
		menuRef.current?.closeMenu();
		if (!file.type.startsWith("image/")) return setIsWrongType(true);
		if (file.size > 1024 * 1024) return setIsTooLarge(true);
		setFileG(file);
		setFileUrl(URL.createObjectURL(file));
		setAdding(true);
	};

	const uploadFile = async (name: string) => {
		setAdding(false);
		if (!fileG) return;
		const body = new FormData();
		body.append("name", name.replace(/[\s:]/g, ""));
		body.append("file", fileG);
		try {
			await serverRequest(`/api/groups/${channel.idG}/emojis`, {
				method: "POST",
				body,
				headers: {},
			});
			const response = await serverRequest<{
				emojis: Array<{
					id: string;
					name: string;
					fileUrl: string;
					createdAt: string;
				}>;
			}>(`/api/groups/${channel.idG}/emojis`);
			setEmoji(
				response.emojis.map((item) => ({
					id: item.id,
					name: item.name,
					file: item.fileUrl,
					createdAt: Date.parse(item.createdAt),
				})),
			);
		} catch (error) {
			console.error("Unable to upload emoji", error);
		}
	};

	return (
		<>
			{adding && (
				<UploadFilePopUp
					uploadFile={uploadFile}
					fileUrl={fileUrl}
					chatInput=""
					cancelled={() => setAdding(false)}
					type="image"
					placeholder="name"
					text="Upload emoji"
				/>
			)}
			{isTooLarge && (
				<InformationPopUp onOk={() => setIsTooLarge(false)}>
					<h3>Your file too large!</h3>
					<p>Maximum size for emotes is 1MB.</p>
				</InformationPopUp>
			)}
			{isWrongType && (
				<InformationPopUp onOk={() => setIsWrongType(false)}>
					<h3>Unsupported file type!</h3>
					<p>Only image files are supported.</p>
				</InformationPopUp>
			)}
			<FixedMenu
				menuPoint={{ x: 20, y: isBookmarked ? 240 : 192 }}
				ref={menuRef}
				parentRef={elementRef}
			>
				<div className={styles.emoji_menu} style={{ display: "block" }}>
					<div className={styles.emoji_header}>Emoji</div>
					<div className={styles.emoji_content}>
						{emoji.map((item) => (
							<span className={styles.emoji_frame} key={item.id}>
								<Image
									width={0}
									height={0}
									src={item.file}
									onClick={(event) =>
										emojiClicked(event, item)
									}
									onMouseLeave={() => setCurEmoji(undefined)}
									onMouseEnter={() => setCurEmoji(item)}
									unoptimized
									alt=""
								/>
							</span>
						))}
						{user.permissions.includes("MANAGE_EMOTES") && (
							<span className={styles.upload_file_file}>
								<Add className={styles.emoji_add} />
								<input
									type="file"
									value=""
									className={styles.upload_file_upload_file}
									onChange={(event) => {
										if (event.target.files?.[0])
											checkFile(event.target.files[0]);
									}}
								/>
							</span>
						)}
					</div>
					{curEmoji && (
						<div className={styles.emoji_info}>
							<Image
								width={30}
								height={30}
								src={curEmoji.file}
								unoptimized
								alt=""
							/>
							<span>:{curEmoji.name}:</span>
						</div>
					)}
				</div>
			</FixedMenu>
			<span
				onClick={(event) =>
					enabled &&
					(menuRef.current?.isOpen()
						? menuRef.current.closeMenu()
						: menuRef.current?.openMenu(event))
				}
				ref={elementRef}
				className={styles.emoji_icon}
			>
				<EmojiEmotionsIcon fontSize="large" />
			</span>
		</>
	);
};

export default Emoji;
