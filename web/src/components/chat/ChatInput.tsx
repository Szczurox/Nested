import React, { useCallback, useEffect, useRef, useState } from "react";
import UploadFile, { FileUploadingData } from "./UploadFile";
import styles from "@/styles/components/chat/ChatInput.module.scss";
import SendIcon from "@mui/icons-material/Send";
import { serverRequest } from "@/global-utils/serverClient";
import { useChannel } from "@/context/channelContext";
import { useUser } from "@/context/userContext";
import { usePopUp } from "@/context/popUpContext";
import Emoji from "./ui-icons/Emoji";
import InformationPopUp from "./popup/InformationPopUp";
import { wait } from "@/components/utils/utils";
import { TextareaAutosize } from "@mui/material";
import { Moment } from "moment";
import moment from "moment";
import { createServerSocket } from "@/global-utils/serverClient";

interface ChatInputProps {
	isMobile: boolean;
	isTyping: boolean;
	isBookmarked: boolean;
	inputUpdate: string;
	fileUploading: (fileData: FileUploadingData) => void;
	setIsTyping: (typing: boolean) => void;
	scrollToBottom: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
	isMobile,
	isTyping,
	isBookmarked,
	inputUpdate,
	fileUploading,
	setIsTyping,
	scrollToBottom,
}) => {
	const [isDisabled, setIsDisabled] = useState<boolean>(false);
	const [slowPopUp, setSlowPopUp] = useState<boolean>(false);
	const [lastMessaged, setLastMessaged] = useState<Moment>(moment());
	const [input, setInput] = useState<string>(inputUpdate); // Textarea input
	const [emojiBucket, setEmojiBucket] = useState<string[]>([]); // Array of all the emoji name|link used in the message
	const [emojis, setEmojis] = useState<string[]>([]); // Array of all saved samojis
	const [inputOnChannels, setInputOnChannels] = useState<[string, string][]>(
		[],
	);
	const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout>(
		setTimeout(() => null, 0),
	);

	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	const { channel } = useChannel();
	const { user } = useUser();
	const { popUp } = usePopUp();

	const textAreaSizeLimit = 2000;
	const realtime = useRef<ReturnType<typeof createServerSocket> | null>(null);

	useEffect(() => {
		if (!channel.id || channel.idG === "@dms") return;
		const socket = createServerSocket();
		realtime.current = socket;
		socket.on("connect", () => {
			socket.emit("channel.join", { channelId: channel.id });
		});
		return () => {
			socket.emit("typing.updated", {
				channelId: channel.id,
				typing: false,
			});
			socket.emit("channel.leave", { channelId: channel.id });
			socket.disconnect();
			realtime.current = null;
		};
	}, [channel.id, channel.idG]);

	const getEmojis = useCallback(
		async (text: string) => {
			const nextBucket = [...emojiBucket];
			if (text.includes(":>") && text.includes("<:")) {
				const emojiSplit = text.split(/(<:.*?:>+)/g);
				for (const el of emojiSplit) {
					if (
						el.startsWith("<:") &&
						el.endsWith(":>") &&
						el.includes("?")
					) {
						let element = emojis.find((e) => e.split("|")[0] == el);
						if (!element) {
							const name = el.split("?")[0].slice(2);
							const group = el.substring(
								el.indexOf("?") + 1,
								el.indexOf(":>"),
							);
							const response = await serverRequest<{
								emojis: Array<{
									name: string;
									fileUrl: string;
								}>;
							}>(`/api/groups/${group}/emojis`);
							const match = response.emojis.find(
								(item) => item.name === name,
							);
							if (match) {
								const file = match.fileUrl;
								const entry = el + "|" + file;
								nextBucket.push(entry);
								setEmojis((current) =>
									current.some((item) => item.startsWith(el))
										? current
										: [...current, entry],
								);
							}
						} else if (!nextBucket.includes(element)) {
							nextBucket.push(element);
						}
					}
				}
			}
			setEmojiBucket(nextBucket);
			return nextBucket;
		},
		[emojiBucket, emojis],
	);

	useEffect(() => {
		setIsDisabled(
			!user.permissions.includes("SEND_MESSAGES") ||
				channel.id == "" ||
				channel.idG == "@dms",
		);
	}, [
		channel.id,
		user.partPermissions,
		user.permissions,
		channel.idG,
		popUp,
	]);

	useEffect(() => {
		setInputOnChannels((inputs) => [
			...inputs.filter((el) => el[0] != channel.id),
			[channel.id, input],
		]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [input]);

	useEffect(() => {
		setInput(inputUpdate);
		textAreaRef.current?.focus();
	}, [inputUpdate]);

	useEffect(() => {
		var element = inputOnChannels.find((el) => el[0] == channel.id);
		if (element) setInput(element[1]);
		else setInput("");
	}, [channel.id, inputOnChannels]);

	useEffect(() => {
		const pasted = (e: ClipboardEvent) => {
			if (
				e.clipboardData!.files[0] == undefined &&
				!isDisabled &&
				document.activeElement?.tagName != "TEXTAREA"
			) {
				let text: string = e.clipboardData!.getData("TEXT");
				getEmojis(text);
				textAreaRef.current?.focus();
			}
		};

		document.addEventListener("paste", pasted);
		return () => {
			document.removeEventListener("paste", pasted);
		};
	}, [input, channel.id, getEmojis, isDisabled]);

	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			if (
				document.activeElement?.tagName != "TEXTAREA" &&
				document.activeElement?.tagName != "INPUT" &&
				!isDisabled &&
				textAreaRef.current &&
				((e.ctrlKey && e.code == "KeyA") || !e.ctrlKey)
			)
				textAreaRef.current.focus();
		};

		document.addEventListener("keydown", handleKeyPress);
		return () => {
			document.removeEventListener("keydown", handleKeyPress);
		};
	}, [isDisabled]);

	async function sendMessage() {
		if (moment() < lastMessaged) {
			setSlowPopUp(true);
			return;
		}
		// Get current input and reset textarea instantly, before message gets fully sent
		const chatInput = input.replace(/^\s+|\s+$/g, "");
		const messageEmojiBucket =
			input.includes(":>") && input.includes("<:")
				? await getEmojis(chatInput)
				: emojiBucket;
		setInput("");
		if (chatInput.length) {
			setInput("");
			try {
				await serverRequest(`/api/channels/${channel.id}/messages`, {
					method: "POST",
					body: JSON.stringify({
						content: chatInput,
						emojiBucket: messageEmojiBucket,
					}),
				});
				scrollToBottom();
				setLastMessaged(moment().add(1, "s"));
			} catch (error) {
				console.error("Unable to send message", error);
				setInput(chatInput);
			}

			setEmojiBucket([]);
		}
	}

	async function sendMessageMobile() {
		userTyping();
		if (slowPopUp || popUp.isOpen) {
			// Don't update input if sending messages too quickly or pop-up is open
			textAreaRef.current!.blur();
		} else if (channel.id != "") {
			sendMessage();
		}
	}

	async function userTyping() {
		if (!isTyping && input != "") {
			clearTimeout(typingTimeout);
			console.log("typing");
			setIsTyping(true);
			realtime.current?.emit("typing.updated", {
				channelId: channel.id,
				typing: true,
			});

			setTypingTimeout(
				setTimeout(async () => {
					setIsTyping(false);
					realtime.current?.emit("typing.updated", {
						channelId: channel.id,
						typing: false,
					});
				}, 5000),
			);
		}
	}

	async function checkMessage(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		userTyping();
		await getEmojis(input);
		if (slowPopUp || popUp.isOpen) {
			// Don't update input if sending messages too quickly or pop-up is open
			e.preventDefault();
			textAreaRef.current!.blur();
		} else if (
			e.key == "Enter" &&
			e.shiftKey == false &&
			channel.id != "" &&
			!isMobile
		) {
			e.preventDefault();
			sendMessage();
		}
	}

	const addedEmoji = (text: string, file: string) => {
		if ((input + text).length <= textAreaSizeLimit) {
			textAreaRef.current!.focus();
			setInput(input + text);
			if (!emojiBucket.find((el) => el[0] == text))
				setEmojiBucket((emojiBucket) => [
					...emojiBucket,
					text + "|" + file,
				]);
		}
	};

	const uploadFile = (fileData: FileUploadingData) => {
		if (fileData.percent == 0) setInput("");
		fileUploading(fileData);
	};

	return (
		<div className={styles.chat_input}>
			{slowPopUp ? (
				<InformationPopUp
					onOk={() => wait(1500).then(() => setSlowPopUp(false))}
				>
					<h3>Slow down!</h3>
					<p>You are trying to send messages too quickly.</p>
				</InformationPopUp>
			) : null}
			{!isDisabled && (
				<UploadFile chatInput={input} uploadCallback={uploadFile} />
			)}
			<form>
				<TextareaAutosize
					value={input}
					wrap="soft"
					maxLength={2000}
					maxRows={input ? (isMobile ? 4 : 10) : 1}
					disabled={
						channel.id == "" || isDisabled || channel.idG == "@dms"
					}
					onChange={(e) => setInput(e.target.value)}
					onPaste={(e) => getEmojis(e.clipboardData!.getData("TEXT"))}
					onKeyDown={checkMessage}
					placeholder={
						!isDisabled
							? `Message #${channel.name}`
							: `You don't have permission to message #${channel.name}`
					}
					ref={textAreaRef}
				/>
				<button
					disabled={channel.id == "" || !isDisabled}
					className={styles.chat_input_button}
					type="submit"
				></button>
			</form>
			<div className={styles.chat_input_icons}>
				{/* <GifIcon fontSize="large" className={styles.chat_input_icon} /> */}
				{!isDisabled && (
					<Emoji
						isBookmarked={isBookmarked}
						enabled={channel.id != "" && channel.idG != "@dms"}
						emojiAdded={addedEmoji}
					/>
				)}
				{isMobile && input != "" ? (
					<SendIcon
						className={styles.chat_input_icon}
						onClick={() => sendMessageMobile()}
					/>
				) : null}
			</div>
		</div>
	);
};
