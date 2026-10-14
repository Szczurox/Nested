import { ProgressBar } from "react-bootstrap";
import React, { useEffect, useRef, useState } from "react";
import Message, { MessageData } from "./Message";
import { FileUploadingData } from "./UploadFile";
import styles from "@/styles/Chat.module.scss";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import moment, { Moment } from "moment";
import { useChannel } from "@/context/channelContext";
import { useUser } from "@/context/userContext";
import { useMessage } from "@/context/messageContext";
import { wait } from "@/components/utils/utils";
import DotsLoading from "@/components/animations/DotsLoading";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ChatInput } from "./ChatInput";
import {
	createServerSocket,
	serverRequest,
} from "@/global-utils/serverClient";

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
		[],
	); // Array of all file progress messages
	const [typingUsers, setTypingUsers] = useState<[string, Moment, string][]>(
		[],
	); // Array of users that are currenty typing (except the user)
	const [nextCursor, setNextCursor] = useState<string | null>(null);
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
					void getMessages();
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

	async function getMessages(cursor = nextCursor) {
		if (!channel.id) return;
		setIsLoading(true);
		try {
			const query = new URLSearchParams({
				limit: String(querySizeLimit),
			});
			if (cursor) query.set("before", cursor);
			const response = await serverRequest<{
				messages: Array<{
					id: string;
					content: string;
					createdAt: string;
					userId: string;
					file?: string | null;
					fileType?: string | null;
					edited: boolean;
					emojiBucket: string[];
				}>;
				hasMore: boolean;
				nextCursor: string | null;
			}>(`/api/channels/${channel.id}/messages?${query}`);
			const mapped = response.messages.map((item) => ({
				id: item.id,
				content: item.content,
				timestamp: new Date(item.createdAt).getTime(),
				uid: item.userId,
				file: item.file ?? undefined,
				fileType: item.fileType as MessageData["fileType"],
				edited: item.edited,
				emojiBucket: item.emojiBucket,
			}));
			setMessages((current) => {
				const combined = [...mapped, ...(cursor ? current : [])];
				return combined.filter(
					(item, index) =>
						combined.findIndex(
							(candidate) => candidate.id === item.id,
						) === index,
				);
			});
			setNextCursor(response.nextCursor);
			setMessagesEnd(!response.hasMore);
			if (!cursor) await new Promise((resolve) => setTimeout(resolve, 0));
		} catch (error) {
			console.error("Unable to load messages", error);
		} finally {
			setIsLoading(false);
		}
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
		setMessages([]);
		setNextCursor(null);
		setMessagesEnd(false);
		setTypingUsers([]);
		setAutoScroll(true);
		setCanScrollToBottom(false);
		setIsTyping(false);
		if (!channel.id || channel.idG === "@dms" || channel.type === "LOADING")
			return;
		const realtime = createServerSocket();
		const addMessage = (item: any) => {
			if (item.channelId !== channel.id) return;
			const mapped = {
				id: item.id,
				content: item.content,
				timestamp: new Date(item.createdAt).getTime(),
				uid: item.userId,
				file: item.file ?? undefined,
				fileType: item.fileType as MessageData["fileType"],
				edited: item.edited,
				emojiBucket: item.emojiBucket ?? [],
			};
			setMessages((current) =>
				current.some((message) => message.id === mapped.id)
					? current.map((message) =>
							message.id === mapped.id ? mapped : message,
						)
					: [...current, mapped],
			);
		};
		realtime.on("connect", () => {
			realtime.emit("channel.join", { channelId: channel.id });
			void getMessages(null);
		});
		realtime.on("message.created", addMessage);
		realtime.on("message.updated", addMessage);
		realtime.on("message.deleted", ({ channelId, messageId }) => {
			if (channelId === channel.id)
				setMessages((current) =>
					current.filter((message) => message.id !== messageId),
				);
		});
		realtime.on("typing.updated", (event) => {
			if (event.channelId !== channel.id || event.userId === user.uid)
				return;
			setTypingUsers((current) =>
				event.typing
					? [
							...current.filter(
								(item) => item[0] !== event.userId,
							),
							[
								event.userId,
								moment().add(5, "seconds"),
								event.nickname,
							],
						]
					: current.filter((item) => item[0] !== event.userId),
			);
		});
		realtime.on("presence.updated", () => undefined);
		return () => {
			realtime.emit("channel.leave", { channelId: channel.id });
			realtime.disconnect();
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
				files.filter((el) => el.id != fileData.id),
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
					),
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
