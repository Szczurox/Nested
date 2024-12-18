import React, { useEffect, useRef, useState } from "react";
import styles from "../../../styles/components/chat/ui-icons/Emoji.module.scss";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import FixedMenu, { FixedMenuHandle } from "../contextmenu/FixedMenu";
import {
	collection,
	query,
	onSnapshot,
	getFirestore,
	limit,
	orderBy,
	Timestamp,
} from "firebase/firestore";
import { useChannel } from "context/channelContext";
import { createFirebaseApp } from "../../../global-utils/clientApp";
import Image from "next/image";

export interface EmojiData {
	id: string; // Emoji ID
	file: string; // Url to emoji file
	name: string; // Emoji name
	createdAt: number;
}

interface EmojiProps {
	enabled: boolean;
	isBookmarked: boolean;
	emojiAdded: (text: string, file: string) => void;
}

const Emoji: React.FC<EmojiProps> = ({ enabled, isBookmarked, emojiAdded }) => {
	const [emoji, setEmoji] = useState<EmojiData[]>([]); // Array of all emotes currently loaded
	const [lastKey, setLastKey] = useState<Timestamp>(new Timestamp(0, 0)); // Creation date of the last emoji fetched
	const [emojiEnd, setEmojiEnd] = useState<boolean>(false); // Are there no more emojis to load
	const [unsubs, setUnsubs] = useState<(() => void)[]>([]); // Array of all unsubscribers

	const { channel } = useChannel();

	const menuRef = useRef<FixedMenuHandle>(null);
	const elementRef = useRef<HTMLSpanElement>(null);

	const querySizeLimit = 60;

	const app = createFirebaseApp();
	const db = getFirestore(app!);

	useEffect(() => {
		console.log(channel.idG);
		setEmoji([]);
		const emojiCollection = collection(db, "groups", channel.idG, "emoji");
		// Emoji query
		const qEmoji = query(
			emojiCollection,
			orderBy("createdAt", "desc"),
			limit(querySizeLimit)
		);

		const unsub = onSnapshot(qEmoji, (querySnapshot) => {
			querySnapshot.docChanges().forEach((change) => {
				if (change.type === "removed" || change.type == "modified") {
					setEmoji((emoji) =>
						[...emoji.filter((el) => el.id !== change.doc.id)].sort(
							(x, y) => {
								return x.createdAt > y.createdAt ? 1 : -1;
							}
						)
					);
				}
				if (change.type === "added" || change.type === "modified") {
					setEmoji((emoji) =>
						[
							...emoji.filter((el) => el.id !== change.doc.id),
							{
								id: change.doc.id,
								createdAt: change.doc.data().createdAt,
								name: change.doc.data().name,
								file: change.doc.data().file,
							},
						].sort((x, y) => {
							return x.createdAt > y.createdAt ? 1 : -1;
						})
					);
				}
			});

			if (querySnapshot.docs.length > 0) {
				setLastKey(
					querySnapshot.docs[querySnapshot.docs.length - 1].data()
						.createdAt
				);
				setEmojiEnd(false);
			} else setEmojiEnd(true);
		});

		setUnsubs((unsubs) => [...unsubs, unsub]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [channel.idG]);

	useEffect(() => {
		return () => {
			if (unsubs.length > 0)
				for (let i = 0; i < unsubs.length; i++) unsubs[i]();
		};
	}, [unsubs]);

	const emojiClicked = (e: any, data: EmojiData) => {
		e.preventDefault();
		emojiAdded(`<:${data.name}?${channel.idG}:>`, data.file);
		if (e.shiftKey != true) {
			menuRef.current!.closeMenu();
		}
	};

	return (
		<>
			<FixedMenu
				menuPoint={{ x: 20, y: isBookmarked ? 240 : 192 }}
				ref={menuRef}
				parentRef={elementRef}
			>
				<div className={styles.emoji_menu} style={{ display: "block" }}>
					<div className={styles.emoji_header}>Emoji</div>
					<div className={styles.emoji_content}>
						{emoji.map((emoji) => (
							<span className={styles.emoji_frame} key={emoji.id}>
								<Image
									width={0}
									height={0}
									src={emoji.file}
									key={emoji.id}
									onClick={(e) => emojiClicked(e, emoji)}
									unoptimized
									alt=""
								/>
							</span>
						))}
					</div>
				</div>
			</FixedMenu>
			<span
				onClick={(e) =>
					menuRef.current && enabled
						? !menuRef.current.isOpen()
							? menuRef.current.openMenu(e)
							: menuRef.current.closeMenu()
						: null
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
