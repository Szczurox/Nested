import React, { useEffect, useRef, useState } from "react";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import styles from "@/styles/components/chat/UploadFile.module.scss";
import { v4 } from "uuid";
import { useChannel } from "@/context/channelContext";
import { useUser } from "@/context/userContext";
import { serverRequest } from "@/global-utils/serverClient";
import UploadFilePopUp from "./popup/UploadFilePopUp";
import InformationPopUp from "./popup/InformationPopUp";

export type MediaType = "image" | "video";

export interface FileUploadingData {
	id: string;
	name: string;
	percent: number;
}

export interface UploadFileProps {
	chatInput?: string;
	uploadCallback: (fileData: FileUploadingData) => void;
}

export const UploadFile: React.FC<UploadFileProps> = ({
	chatInput,
	uploadCallback,
}) => {
	const [fileName, setFileName] = useState<string>("");
	const [fileType, setFileType] = useState<string>("");
	const [fileUrl, setFileUrl] = useState<string>("");
	const [fileG, setFileG] = useState<File>();
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [isTooLarge, setIsTooLarge] = useState<boolean>(false);
	const [isWrongType, setIsWrongType] = useState<boolean>(false);

	const inputRef = useRef<HTMLInputElement>(null);

	const { channel } = useChannel();
	const { user } = useUser();

	useEffect(() => {
		const dropped = (e: DragEvent) => {
			e.preventDefault();
			if (e.dataTransfer!.files[0] != undefined && channel.id != "") {
				checkFile(e.dataTransfer!.files[0]);
			}
		};

		const pasted = (e: ClipboardEvent) => {
			if (e.clipboardData!.files[0] != undefined && channel.id != "") {
				checkFile(e.clipboardData!.files[0]);
			}
		};

		document.addEventListener("paste", pasted);
		document.addEventListener("drop", dropped);
		document.addEventListener("dragover", (e) => {
			e.preventDefault();
		});
		return () => {
			document.removeEventListener("paste", pasted);
			document.removeEventListener("drop", dropped);
			document.removeEventListener("dragover", (e) => {
				e.preventDefault();
			});
		};
	}, [channel.id]);

	async function checkFile(e: File) {
		console.log(e.type);
		// Allow only images, gifs less than 8MB
		if (
			e.type.substring(0, 5) == "image" ||
			e.type.substring(0, 5) == "video"
		) {
			if (e.size / 1024 / 1024 < 8) {
				console.log("valid");
				setFileType(e.type.substring(0, 5));
				setFileG(e);
				setFileName(e.name);
				const objectUrl = URL.createObjectURL(e);
				if (objectUrl.startsWith('blob:')) {
					setFileUrl(objectUrl);
				}
				setIsOpen(true);
			} else setIsTooLarge(true);
		} else setIsWrongType(true);
	}

	const uploadFile = async (input: string) => {
		setIsOpen(false);
		const id = v4();
		uploadCallback({ id: id, name: fileName, percent: 0 });
		try {
			const body = new FormData();
			body.append("file", fileG!);
			const { url } = await serverRequest<{ url: string }>(
				`/api/channels/${channel.id}/uploads`,
				{ method: "POST", body, headers: {} }
			);
			await serverRequest(`/api/channels/${channel.id}/messages`, {
				method: "POST",
				body: JSON.stringify({ content: input.trim() || "[file]", file: url, fileType }),
			});
			uploadCallback({ id, name: fileName, percent: 101 });
		} catch (error) {
			console.error("Unable to upload file", error);
			uploadCallback({ id, name: fileName, percent: 101 });
		}
	};

	return (
		<div className={styles.upload_file}>
			{isOpen && (
				<UploadFilePopUp
					uploadFile={uploadFile}
					fileUrl={fileUrl}
					chatInput={chatInput ? chatInput : ""}
					cancelled={() => setIsOpen(false)}
					type={fileType as MediaType}
				/>
			)}
			{isTooLarge && (
				<InformationPopUp
					onOk={() => {
						setIsTooLarge(false);
						inputRef.current!.blur();
					}}
				>
					<h3>Your file too large!</h3>
					<p>Maximum file upload size is 8MB.</p>
				</InformationPopUp>
			)}
			{isWrongType && (
				<InformationPopUp
					onOk={() => {
						setIsWrongType(false);
						inputRef.current!.blur();
					}}
				>
					<h3>Unsupported file type!</h3>
					<p>Only image, video and gif files are supported.</p>
				</InformationPopUp>
			)}
			<form>
				<div className={styles.upload_file_file}>
					<AddCircleIcon fontSize="large" />
					<input
						type="file"
						value=""
						name=""
						className={styles.upload_file_upload_file}
						onChange={(e) => {
							if (e.target.files) checkFile(e.target.files[0]);
						}}
						disabled={channel.id == ""}
						ref={inputRef}
					/>
				</div>
			</form>
		</div>
	);
};

export default UploadFile;
