import React, { useEffect, useState } from "react";
import styles from "@/styles/components/chat/Settings.module.scss";
import ScreenPopUp from "./popup/ScreenPopUp";
import CloseIcon from "@mui/icons-material/Close";
import { serverRequest } from "@/global-utils/serverClient";
import { ProfileSettings } from "./settings/ProfileSettings";
import { useRouter } from "next/dist/client/components/navigation";
import { useUser } from "@/context/userContext";

export interface SettingsProps {
	isMobile: boolean;
	onCancel: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isMobile, onCancel }) => {
	const [active, setActive] = useState<string>("");
	const router = useRouter();
	const { refreshUser } = useUser();

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
		try {
			await serverRequest("/api/auth/logout", { method: "POST" });
		} catch (error) {
			console.error("Logout request failed", error);
		} finally {
			refreshUser();
			onCancel();
			router.push("/login");
		}
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
