import { ProgressBar } from "react-bootstrap";
import React, { useEffect, useRef, useState } from "react";
import Message, { MessageData } from "./Message";
import { FileUploadingData } from "./UploadFile";
import styles from "../../styles/Chat.module.scss";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { createFirebaseApp } from "../../global-utils/clientApp";
import {
	collection,
	doc,
	documentId,
	getFirestore,
	limit,
	onSnapshot,
	orderBy,
	query,
	startAfter,
	Timestamp,
	updateDoc,
	where,
} from "firebase/firestore";
import moment, { Moment } from "moment";
import { serverTimestamp } from "firebase/firestore";
import { useChannel } from "context/channelContext";
import { useUser } from "context/userContext";
import { useMessage } from "context/messageContext";
import { wait } from "components/utils/utils";
import DotsLoading from "components/animations/DotsLoading";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ChatInput } from "./ChatInput";

interface ChatMainProps {
	isNavbarOpen: boolean;
	isMembersOpen: boolean;
	isBookmarked: boolean;
	hideNavbar: () => void;
}

export const ChatMain: React.FC<ChatMainProps> = ({
	isNavbarOpen,
	isMembersOpen,
	isBookmarked,
	hideNavbar,
}) => {
	const [messages, setMessages] = useState<MessageData[]>([]); // Array of all messages currently loaded
	const [filesUploading, setFilesUploading] = useState<FileUploadingData[]>(
		[]
	); // Array of all file progress messages
	const [typingUsers, setTypingUsers] = useState<[string, Moment, string][]>(
		[]
	); // Array of users that are currenty typing (except the user)
	const [unsubs, setUnsubs] = useState<(() => void)[]>([]); // Array of all unsubscribers
	const [lastKey, setLastKey] = useState<Timestamp>(new Timestamp(0, 0)); // Creation date of the last message fetched
	const [messagesEnd, setMessagesEnd] = useState<boolean>(false); // True if no more messages to load on the current channel
	const [canScrollToBottom, setCanScrollToBottom] = useState<boolean>(false); // Show Scroll To Bottom button
	const [isLoading, setIsLoading] = useState<boolean>(false); // Are new messages loading
	const [isTyping, setIsTyping] = useState<boolean>(false);
	const [autoScroll, setAutoScroll] = useState<boolean>(true); // Can autoscroll (used when new messages appear)
	const [input, setInput] = useState<string>("");

	const listInnerRef = useRef<HTMLHeadingElement>(null);

	const isMobile = useMediaQuery("(pointer: none), (pointer: coarse)");

	const { channel } = useChannel();
	const { user } = useUser();
	const { message } = useMessage();

	const app = createFirebaseApp();
	const db = getFirestore(app!);

	const messagesCollection = collection(
		db,
		"groups",
		channel.idG,
		"channels",
		channel.id ? channel.id : "None",
		"messages"
	);

	const participantsCollection = collection(
		db,
		"groups",
		channel.idG,
		"channels",
		channel.id ? channel.id : "None",
		"participants"
	);

	const querySizeLimit = 20;

	useEffect(() => {
		if (!isMobile) {
			const { scrollTop, scrollHeight, clientHeight } =
				listInnerRef.current!;
			if (scrollTop >= scrollHeight - clientHeight - 60) scrollToBottom();
		} else {
			var msg = document.getElementById(message.id);
			wait(100).then(() => (msg ? msg.scrollIntoView(false) : null));
		}
	}, [message, isMobile]);

	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const { scrollTop, scrollHeight, clientHeight } = listInnerRef.current!;
		setAutoScroll(scrollTop >= scrollHeight - clientHeight - 100);

		if (listInnerRef.current) {
			const { scrollTop, scrollHeight } = listInnerRef.current;
			if (
				isLoading &&
				e.currentTarget.scrollTop <
					e.currentTarget.scrollHeight / 4 - 202
			)
				e.currentTarget.scrollTop =
					e.currentTarget.scrollHeight / 4 + 101;
			if (scrollTop < scrollHeight / 4 && !messagesEnd) {
				if (!isLoading) {
					setIsLoading(true);
					const unsub = getMessages();
					setUnsubs([...unsubs, unsub]);
				}
			}
			if (scrollTop < scrollHeight / 1.9 && messages.length > 60) {
				setCanScrollToBottom(true);
			} else {
				setCanScrollToBottom(false);
			}
		}
	};

	const onImageLoadComplete = () => {
		if (listInnerRef.current && autoScroll) {
			listInnerRef.current.focus();
			scrollToBottom();
			wait(300).then(() => scrollToBottom());
		}
	};

	const scrollToBottom = () => {
		if (listInnerRef.current != null) {
			listInnerRef.current.scrollTop =
				listInnerRef.current.scrollHeight -
				listInnerRef.current.clientHeight;
		}
	};

	const updateLastActive = async () =>
		await updateDoc(doc(participantsCollection, user.uid), {
			lastActive: serverTimestamp(),
		});

	const handleMessageSnapshot = (qMes: any, isFirstBatch: boolean) => {
		return onSnapshot(qMes, (querySnapshot: any) => {
			querySnapshot.docChanges().forEach((change: any) => {
				if (isFirstBatch && change.type === "added") scrollToBottom();
				if (change.type === "removed" || change.type === "modified") {
					setMessages((messages) => [
						...messages.filter((el) => el.id !== change.doc.id),
					]);
				}
				if (
					(change.type === "added" || change.type === "modified") &&
					change.doc.data().createdAt != null
				) {
					setMessages((messages) =>
						[
							...messages.filter((el) => el.id !== change.doc.id),
							{
								id: change.doc.id,
								content: change.doc.data().content,
								timestamp:
									change.doc.data().createdAt.seconds * 1000 +
									change.doc.data().createdAt.nanoseconds /
										1000000,
								uid: change.doc.data().userid,
								file: change.doc.data().file,
								edited: change.doc.data().edited,
								fileType: change.doc.data().fileType,
								emojiBucket: change.doc.data().emojiBucket,
							},
						].sort((x, y) => {
							return x.timestamp > y.timestamp ? 1 : -1;
						})
					);
				}
			});

			if (querySnapshot.docChanges().length < querySizeLimit)
				updateLastActive();
			if (querySnapshot.docs.length > 0) {
				setLastKey(
					querySnapshot.docs[querySnapshot.docs.length - 1].data()
						.createdAt
				);
				setMessagesEnd(false);
			} else setMessagesEnd(true);
			setIsLoading(false);
		});
	};

	function getMessages() {
		// Channels query
		const qMes = query(
			messagesCollection,
			orderBy("createdAt", "desc"),
			limit(querySizeLimit),
			startAfter(lastKey)
		);

		return handleMessageSnapshot(qMes, false);
	}

	useEffect(() => {
		const interval = setInterval(async () => {
			setTypingUsers((users) => [
				...users.filter((el) => el[1].isAfter(moment())),
			]);
		}, 2000);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		function getMessagesFirstBatch() {
			if (
				channel.id != "" &&
				channel.idG != "@dms" &&
				channel.type != "LOADING"
			) {
				// Channels query
				const qMes = query(
					messagesCollection,
					orderBy("createdAt", "desc"),
					limit(querySizeLimit)
				);

				scrollToBottom();
				return handleMessageSnapshot(qMes, true);
			} else return () => {};
		}

		function getTypingUsers() {
			if (
				channel.id != "" &&
				channel.idG != "@dms" &&
				channel.type != "LOADING"
			) {
				// Participants querry
				const qPart = query(
					participantsCollection,
					where(documentId(), "!=", user.uid)
				);

				return onSnapshot(qPart, (querySnapshot) => {
					querySnapshot.docChanges().forEach((change) => {
						if (
							change.type == "modified" ||
							change.type == "added"
						) {
							// User is typing
							setTypingUsers((users) => [
								...users.filter((el) =>
									el[1].isAfter(moment())
								),
							]);
							if (change.doc.data().lastTyping) {
								const lastType = change.doc
									.data()
									.lastTyping.toMillis();
								if (
									moment(lastType)
										.add(5, "second")
										.isAfter(moment())
								)
									setTypingUsers((users) => [
										...users.filter(
											(el) => el[0] != change.doc.id
										),
										[
											change.doc.id,
											moment(lastType).add(5, "second"),
											change.doc.data().nickname,
										],
									]);
							}
							// User stopped typing
							else
								setTypingUsers((users) => [
									...users.filter(
										(el) => el[0] != change.doc.id
									),
								]);
						}
					});
				});
			} else return () => {};
		}

		setMessages([]);
		setTypingUsers([]);
		setAutoScroll(true);
		setCanScrollToBottom(false);
		setIsTyping(false);
		const unsub = getMessagesFirstBatch();
		const unsub2 = getTypingUsers();
		scrollToBottom();
		return () => {
			if (unsubs.length > 0)
				for (let i = 0; i < unsubs.length; i++) unsubs[i]();
			unsub();
			unsub2();
		};

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [channel.id, channel.idG, user.uid, channel.type]);

	// Message at the bottom that show file upload progress
	const fileUploading = (fileData: FileUploadingData) => {
		if (fileData.percent != 101)
			setFilesUploading((files) => [
				...files.filter((el) => el.id != fileData.id),
				fileData,
			]);
		else
			setFilesUploading((files) =>
				files.filter((el) => el.id != fileData.id)
			);
		if (autoScroll) {
			scrollToBottom();
		}
	};

	const showTypingUsers = () => {
		if (typingUsers.length > 3) return "many people are typing...";
		if (typingUsers.length == 3)
			return `${typingUsers[0][2]}, ${typingUsers[1][2]} and ${typingUsers[2][2]} are typing...`;
		if (typingUsers.length == 2)
			return `${typingUsers[0][2]} and ${typingUsers[1][2]} are typing...`;
		if (typingUsers.length == 1) return `${typingUsers[0][2]} is typing...`;
	};

	const updateInput = async (newInp: string) => {
		setInput("");
		await wait(10);
		setInput(newInp);
	};

	return (
		<div
			className={
				isNavbarOpen
					? `${styles.chat} ${styles.chat_mobile_navbar}`
					: isMembersOpen
					? `${styles.chat} ${styles.chat_mobile_members}`
					: styles.chat
			}
			onClick={
				isNavbarOpen || isMembersOpen
					? (_) => hideNavbar()
					: (_) => null
			}
		>
			<div
				className={styles.chat_messages}
				onScroll={(e) => handleScroll(e)}
				ref={listInnerRef}
			>
				{messages.map(
					({
						id,
						content,
						timestamp,
						uid,
						file,
						edited,
						fileType,
						emojiBucket,
					}) => (
						<Message
							key={id}
							id={id}
							content={content}
							time={timestamp}
							userid={uid}
							file={file}
							onImageLoad={onImageLoadComplete}
							updateInput={updateInput}
							edited={edited}
							fileType={fileType}
							emojiBucket={emojiBucket}
							isMobile={isMobile}
						/>
					)
				)}
				{filesUploading.map(({ name, percent, id }) => {
					return (
						<Message
							key={id}
							id={id}
							content={""}
							time={moment().utcOffset("+00:00").valueOf()}
							userid={user.uid}
							isMobile={isMobile}
						>
							<div className={styles.chat_file_uploading}>
								<InsertDriveFileIcon
									className={styles.chat_upload_icon}
								/>
								<div className={styles.chat_upload_info}>
									<div className={styles.chat_upload_name}>
										{name}
									</div>
									<ProgressBar
										now={percent}
										className={
											styles.chat_upload_progressbar
										}
									/>
								</div>
							</div>
						</Message>
					);
				})}
			</div>
			<ChatInput
				isMobile={isMobile}
				isTyping={isTyping}
				isBookmarked={isBookmarked}
				inputUpdate={input}
				fileUploading={fileUploading}
				scrollToBottom={scrollToBottom}
				setIsTyping={(typing: boolean) => setIsTyping(typing)}
			/>
			{canScrollToBottom && (
				<div
					className={styles.chat_jump}
					onClick={(_) => {
						setCanScrollToBottom(false);
						scrollToBottom();
					}}
				>
					Jump To Present
				</div>
			)}
			<span
				className={
					typingUsers.length
						? styles.chat_typing_users
						: styles.chat_no_typing_users
				}
				style={
					isBookmarked
						? {
								marginBottom: typingUsers.length
									? "108px"
									: "110px",
						  }
						: undefined
				}
			>
				{typingUsers.length != 0 && (
					<span className={styles.chat_typing_dots}>
						<DotsLoading />
					</span>
				)}
				{showTypingUsers()}
			</span>
		</div>
	);
};
