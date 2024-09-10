import React, { useEffect, useRef, useState } from "react";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import styles from "../../styles/components/chat/UploadFile.module.scss";
import { v4 } from "uuid";
import {
	getStorage,
	ref,
	getDownloadURL,
	uploadBytesResumable,
} from "firebase/storage";
import {
	addDoc,
	collection,
	doc,
	getFirestore,
	serverTimestamp,
	updateDoc,
} from "firebase/firestore";
import { useChannel } from "context/channelContext";
import { useUser } from "context/userContext";
import { createFirebaseApp } from "../../firebase-utils/clientApp";
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

	const storage = getStorage();
	const app = createFirebaseApp();
	const db = getFirestore(app!);

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

	useEffect(() => {
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
	}, [channel.id, dropped, pasted]);

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
				setFileUrl(URL.createObjectURL(e));
				setIsOpen(true);
			} else setIsTooLarge(true);
		} else setIsWrongType(true);
	}

	const uploadFile = (input: string) => {
		setIsOpen(false);
		const id = v4();
		uploadCallback({ id: id, name: fileName, percent: 0 });
		const fileRef = ref(
			storage,
			`media/${channel.idG}/${channel.id}/${id}/${fileG!.name}`
		);
		const uploadTask = uploadBytesResumable(fileRef, fileG!);
		uploadTask.on(
			"state_changed",
			(snapshot) => {
				const progress =
					(snapshot.bytesTransferred / snapshot.totalBytes) * 100;
				uploadCallback({ id: id, name: fileName, percent: progress });
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
				uploadCallback({ id: id, name: fileName, percent: 101 });
			},
			() => {
				getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
					console.log("File uploaded! ", downloadURL);
					fileSubmit(downloadURL, input);
					uploadCallback({ id: id, name: fileName, percent: 101 });
				});
			}
		);
	};

	async function fileSubmit(url: string, input: string) {
		input.replace(/\s/g, "");
		await updateDoc(
			doc(db, "groups", channel.idG, "channels", channel.id),
			{
				lastMessageAt: serverTimestamp(),
			}
		).catch((err) => console.log("Update lastMessagedAt Error: " + err));

		await addDoc(
			collection(
				db,
				"groups",
				channel.idG,
				"channels",
				channel.id,
				"messages"
			),
			{
				createdAt: serverTimestamp(),
				content: input,
				userid: user.uid,
				file: url,
				fileType: fileType,
			}
		);
	}

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
