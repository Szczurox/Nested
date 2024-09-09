import React, { ReactNode, useEffect } from "react";
import styles from "../../../styles/components/chat/popups/DeleteConfirmPopUp.module.scss";
import ScreenPopUp from "./ScreenPopUp";
import PopUpButton from "./PopUpButton";

export interface DeletePopUpProps {
	onConfirm: () => void;
	onCancel: () => void;
	children?: ReactNode;
}

const DeletePopUp: React.FC<DeletePopUpProps> = ({
	onConfirm,
	onCancel,
	children,
}) => {
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key == "Enter") onConfirm();
		};

		document.addEventListener("keydown", handler, false);
		return () => {
			document.removeEventListener("keydown", handler, false);
		};
	}, [onConfirm]);

	return (
		<ScreenPopUp>
			<div className={styles.popup_text}>{children}</div>
			<div className={styles.popup_buttons}>
				<div
					className={styles.popup_cancel}
					onClick={(_) => onCancel()}
				>
					Cancel
				</div>
				<PopUpButton onClick={(_) => onConfirm()} color={"red"}>
					Delete
				</PopUpButton>
			</div>
		</ScreenPopUp>
	);
};

export default DeletePopUp;
