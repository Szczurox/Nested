import React, { useEffect, useRef, useState } from "react";
import styles from "../../../styles/components/chat/popups/UploadFilePopUp.module.scss";
import ScreenPopUp from "./ScreenPopUp";
import { useChannel } from "../../../context/channelContext";
import { TextareaAutosize } from "@mui/material";
import PopUpButton from "./PopUpButton";
import { MediaType } from "../UploadFile";
import Image from "next/image";

interface UploadFilePopUpProps {
	fileUrl: string;
	chatInput: string;
	type: MediaType;
	uploadFile: (input: string) => void;
	cancelled: () => void;
}

const UploadFilePopUp: React.FC<UploadFilePopUpProps> = ({
	uploadFile,
	cancelled,
	fileUrl: initialFileUrl,
	chatInput,
	type,
}) => {
	const [input, setInput] = useState<string>(chatInput);
	const [fileUrl, setFileUrl] = useState<string>(initialFileUrl.startsWith('blob:') ? initialFileUrl : '');
	if (!fileUrl.startsWith('blob:')) {
		return null; // or handle the error appropriately
	}

	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	const { channel } = useChannel();

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (
				document.activeElement?.tagName != "TEXTAREA" &&
				textAreaRef.current &&
				((e.ctrlKey && e.code == "KeyA") || !e.ctrlKey)
			)
				textAreaRef.current!.focus();
			if (e.key == "Enter") {
				console.log(input);
				uploadFile(input);
			}
		};

		document.addEventListener("keydown", handler, false);
		return () => {
			document.removeEventListener("keydown", handler, false);
		};
	}, [input, uploadFile]);

	useEffect(() => {
		const pasted = (e: ClipboardEvent) => {
			if (e.clipboardData!.files[0] == undefined && channel.id != "")
				textAreaRef.current!.focus();
		};

		document.addEventListener("paste", pasted);
		return () => {
			document.removeEventListener("paste", pasted);
		};
	}, [input, channel.id]);

	const uploadFileKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key == "Enter" && e.shiftKey == false && channel.id != "") {
			e.preventDefault();
			uploadFile(input);
		}
	};

	return (
		<ScreenPopUp>
			<div>
				{fileUrl && (type === "image" ? (
					<Image
						className={styles.upload_file_media}
						src={fileUrl}
						alt=""
						width={0}
						height={0}
					/>
				) : (
					<video className={styles.upload_file_media} controls>
						<source src={fileUrl} />
						Your browser does not support the video files, {fileUrl}
						.
					</video>
				))}
				<p>
					Upload to <b>#{channel.name}</b>
				</p>
				<div className={styles.popup_input}>
					<form>
						<TextareaAutosize
							value={input}
							maxRows={10}
							wrap="soft"
							maxLength={2000}
							disabled={channel.id == ""}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => uploadFileKey(e)}
							placeholder={`Message #${channel.name}`}
							ref={textAreaRef}
							onFocus={(e) =>
								e.target.setSelectionRange(
									e.target.value.length,
									e.target.value.length
								)
							}
							autoFocus
						/>
					</form>
				</div>
				<div className={styles.popup_buttons}>
					<div
						className={styles.popup_cancel}
						onClick={(_) => {
							setInput("");
							cancelled();
						}}
					>
						Cancel
					</div>
					<PopUpButton
						onClick={(_) => uploadFile(input)}
						color={"red"}
					>
						Upload
					</PopUpButton>
				</div>
			</div>
		</ScreenPopUp>
	);
};

export default UploadFilePopUp;
