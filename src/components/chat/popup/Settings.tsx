import React, { useEffect } from "react";
import styles from "../../../styles/components/chat/popups/Settings.module.scss";
import ScreenPopUp from "./ScreenPopUp";
import PopUpButton from "./PopUpButton";

export interface SettingsProps {
	onCancel: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onCancel }) => {
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key == "Escape") onCancel();
		};

		document.addEventListener("keydown", handler, false);
		return () => document.removeEventListener("keydown", handler, false);
	}, [onCancel]);

	return (
		<ScreenPopUp full={true}>
			<div className={styles.popup_buttons}>
				<div
					className={styles.popup_cancel}
					onClick={(_) => onCancel()}
				>
					Cancel
				</div>
			</div>
		</ScreenPopUp>
	);
};

export default Settings;
