import React, { ReactNode, useEffect, useRef, useState } from "react";
import styles from "../../../styles/components/chat/popups/ChannelPopUp.module.scss";
import ScreenPopUp from "./ScreenPopUp";
import { TextareaAutosize } from "@mui/material";
import PopUpButton from "./PopUpButton";

interface InputPopUpProps {
	onConfirm: (input: string) => void;
	onCancel: () => void;
	value?: string;
	placeHolder?: string;
	confirmButtonName?: string;
	hash?: boolean;
	children?: ReactNode;
}

const InputPopUp: React.FC<InputPopUpProps> = ({
	onConfirm,
	onCancel,
	value = "",
	placeHolder = "",
	confirmButtonName = "Confirm",
	hash = false,
	children = null,
}) => {
	const [input, setInput] = useState<string>(value);

	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (
				document.activeElement?.tagName != "TEXTAREA" &&
				textAreaRef.current &&
				((e.ctrlKey && e.code == "KeyA") || !e.ctrlKey)
			)
				textAreaRef.current!.focus();
		};

		document.addEventListener("keydown", handler, false);
		return () => {
			document.removeEventListener("keydown", handler, false);
		};
	}, []);

	useEffect(() => {
		const pasted = (e: ClipboardEvent) => {
			if (
				e.clipboardData!.files[0] == undefined &&
				document.activeElement?.tagName != "TEXTAREA"
			) {
				if ((input + e.clipboardData!.getData("Text")).length <= 40)
					setInput(input + e.clipboardData!.getData("Text"));
				else
					setInput(
						(input + e.clipboardData!.getData("Text")).substring(
							0,
							40
						)
					);
			}
		};

		document.addEventListener("paste", pasted);
		return () => {
			document.removeEventListener("paste", pasted);
		};
	}, [input]);

	const createChannelKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key == "Enter") {
			e.preventDefault();
			onConfirm(input);
		}
	};

	return (
		<ScreenPopUp>
			<div>
				<div className={styles.popup_text}>{children}</div>
				<div className={styles.popup_input}>
					{hash && <span className={styles.hash}>#</span>}
					<form>
						<TextareaAutosize
							value={input}
							style={!hash ? { paddingLeft: "20px" } : {}}
							wrap="off"
							maxRows={1}
							maxLength={100}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => createChannelKey(e)}
							placeholder={placeHolder}
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
							onCancel();
						}}
					>
						Cancel
					</div>
					<PopUpButton
						onClick={(_) => onConfirm(input)}
						color={"grey"}
						disabled={!input.replace(/\s/g, "").length}
					>
						{confirmButtonName}
					</PopUpButton>
				</div>
			</div>
		</ScreenPopUp>
	);
};

export default InputPopUp;
