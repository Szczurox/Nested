import React, { useEffect, useState } from "react";
import styles from "../../styles/components/chat/Settings.module.scss";
import ScreenPopUp from "./popup/ScreenPopUp";
import CloseIcon from "@material-ui/icons/Close";
import { getAuth, signOut } from "firebase/auth";
import { ProfileSettings } from "./settings/ProfileSettings";

export interface SettingsProps {
	isMobile: boolean;
	onCancel: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isMobile, onCancel }) => {
	const [active, setActive] = useState<string>("");

	useEffect(() => {
		if (!isMobile) setActive("profile");
	}, [isMobile]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key == "Escape") onCancel();
		};

		document.addEventListener("keydown", handler, false);
		return () => document.removeEventListener("keydown", handler, false);
	}, [onCancel]);

	const logOut = async () => {
		const auth = getAuth();
		signOut(auth)
			.then(() => {
				console.log("signed out");
			})
			.catch((error) => {
				console.log("SIGN OUT ERROR: " + error.message);
			});
	};

	const navbar = (
		<div className={styles.navbar}>
			<div
				className={`${styles.navbar_setting} ${
					active == "profile" && !isMobile && styles.active
				}`}
				id="profile"
				onClick={(e: React.MouseEvent) => setActive(e.currentTarget.id)}
			>
				Profile
			</div>
			<div
				className={styles.navbar_setting_logout}
				onClick={() => logOut()}
			>
				Log Out
			</div>
		</div>
	);

	return (
		<ScreenPopUp full={true}>
			<div className={styles.settings}>
				{isMobile ? (
					<div className={styles.header}>
						<p>Settings</p>
						<div className={styles.close}>
							<CloseIcon
								onClick={() =>
									active ? setActive("") : onCancel()
								}
							/>
						</div>
					</div>
				) : null}
				<div className={styles.container}>
					{!isMobile ? navbar : !active && navbar}
					{active == "profile" && (
						<div className={styles.content}>
							<ProfileSettings />
						</div>
					)}

					{!isMobile && (
						<div className={styles.close}>
							<CloseIcon onClick={() => onCancel()} />
						</div>
					)}
				</div>
			</div>
		</ScreenPopUp>
	);
};

export default Settings;
