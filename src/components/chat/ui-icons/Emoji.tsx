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
	addDoc,
	doc,
	serverTimestamp,
	updateDoc,
} from "firebase/firestore";
import { useChannel } from "context/channelContext";
import { createFirebaseApp } from "../../../global-utils/clientApp";
import Image from "next/image";
import { useUser } from "context/userContext";
import Add from "@mui/icons-material/Add";
import UploadFilePopUp from "../popup/UploadFilePopUp";
import { storage } from "firebase-admin";
import {
	uploadBytesResumable,
	getDownloadURL,
	getStorage,
	ref,
} from "firebase/storage";
import { v4 } from "uuid";
import { MediaType } from "../UploadFile";
import InformationPopUp from "../popup/InformationPopUp";

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
	const [adding, setAdding] = useState<boolean>(false); // Open emote upload window
	const [fileType, setFileType] = useState<string>("");
	const [fileUrl, setFileUrl] = useState<string>("");
	const [fileG, setFileG] = useState<File>();
	const [isTooLarge, setIsTooLarge] = useState<boolean>(false);
	const [isWrongType, setIsWrongType] = useState<boolean>(false);
	const [unsubs, setUnsubs] = useState<(() => void)[]>([]); // Array of all unsubscribers
	const [curEmoji, setCurEmoji] = useState<EmojiData | undefined>();

	const inputRef = useRef<HTMLInputElement>(null);

	const { channel } = useChannel();
	const { user } = useUser();

	const menuRef = useRef<FixedMenuHandle>(null);
	const elementRef = useRef<HTMLSpanElement>(null);

	// Number of emojis allowed on the server is currently limited to 60
	const querySizeLimit = 60;

	const storage = getStorage();
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
		setCurEmoji(undefined);
		emojiAdded(`<:${data.name}?${channel.idG}:>`, data.file);
		if (e.shiftKey != true) {
			menuRef.current!.closeMenu();
		}
	};

	async function checkFile(e: File) {
		console.log(e.type);
		menuRef.current!.closeMenu();
		// Allow  emotes below 1MB
		if (e.type.substring(0, 5) == "image") {
			if (e.size / 1024 / 1024 < 1) {
				console.log("valid");
				setFileType(e.type.substring(0, 5));
				setFileG(e);
				const objectUrl = URL.createObjectURL(e);
				if (objectUrl.startsWith("blob:")) {
					setFileUrl(objectUrl);
				}
				setAdding(true);
			} else setIsTooLarge(true);
		} else setIsWrongType(true);
	}

	const uploadFile = (input: string) => {
		setAdding(false);
		const id = v4();
		const fileRef = ref(
			storage,
			`media/${channel.idG}/emoji/${id}/${fileG!.name}`
		);
		const uploadTask = uploadBytesResumable(fileRef, fileG!);
		uploadTask.on(
			"state_changed",
			(snapshot) => {
				const progress =
					(snapshot.bytesTransferred / snapshot.totalBytes) * 100;
				console.log("Upload is " + progress + "% done");
				switch (snapshot.state) {
					case "paused":
						console.log("Upload is paused");
						break;
					case "running":
						console.log("Upload is running");
						break;
				}
			},
			(error) => {
				console.log(error);
			},
			() => {
				getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
					console.log("File uploaded! ", downloadURL);
					fileSubmit(downloadURL, input);
				});
			}
		);
	};

	async function fileSubmit(url: string, input: string) {
		const name = input.replace(/[\s\:]/g, "");

		await addDoc(collection(db, "groups", channel.idG, "emoji"), {
			createdAt: serverTimestamp(),
			file: url,
			name: name,
		});
	}

	return (
		<>
			{adding && (
				<UploadFilePopUp
					uploadFile={uploadFile}
					fileUrl={fileUrl}
					chatInput={""}
					cancelled={() => setAdding(false)}
					type={fileType as MediaType}
					placeholder="name"
					text="Upload emoji"
				/>
			)}
			{isTooLarge && (
				<InformationPopUp
					onOk={() => {
						setIsTooLarge(false);
					}}
				>
					<h3>Your file too large!</h3>
					<p>Maximum size for emotes is 1MB.</p>
				</InformationPopUp>
			)}
			{isWrongType && (
				<InformationPopUp
					onOk={() => {
						setIsWrongType(false);
					}}
				>
					<h3>Unsupported file type!</h3>
					<p>Only image, video and gif files are supported.</p>
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
						{emoji.map((em) => (
							<span className={styles.emoji_frame} key={em.id}>
								<Image
									width={0}
									height={0}
									src={em.file}
									key={em.id}
									onClick={(e) => emojiClicked(e, em)}
									onMouseLeave={(_) => {
										setCurEmoji(undefined);
									}}
									onMouseEnter={(_) => {
										setCurEmoji(
											emoji.find((e) => e.id == em.id)
										);
									}}
									unoptimized
									alt=""
								/>
							</span>
						))}
						{user.permissions.find((e) => e == "MANAGE_EMOTES") ? (
							<span className={styles.upload_file_file}>
								<Add className={styles.emoji_add} />
								<input
									type="file"
									value=""
									name=""
									className={styles.upload_file_upload_file}
									onChange={(e) => {
										if (e.target.files)
											checkFile(e.target.files[0]);
									}}
									disabled={channel.id == ""}
									ref={inputRef}
								/>
							</span>
						) : null}
					</div>
					{curEmoji ? (
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
					) : null}
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
