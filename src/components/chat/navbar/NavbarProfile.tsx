import React, { useState } from "react";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import HeadsetIcon from "@mui/icons-material/Headset";
import HeadsetOffIcon from "@mui/icons-material/HeadsetOff";
import SettingsIcon from "@mui/icons-material/Settings";
import styles from "../../../styles/components/chat/navbar/NavbarProfile.module.scss";
import { useUser } from "context/userContext";
import Settings from "../Settings";
import { Avatar } from "@mui/material";
import { useVoice } from "context/voiceContext";

interface NavbarProfileProps {
	isMobile: boolean;
}

export const NavbarProfile: React.FC<NavbarProfileProps> = ({ isMobile }) => {
	const { user } = useUser();
	const { voice, setCurrentVoiceState } = useVoice();

	const [showSettings, setShowSettings] = useState<boolean>(false);

	const toggleMute = () => {
		setCurrentVoiceState(voice.connected, !voice.muted, voice.deafened);
	};

	const toggleDeaf = () => {
		setCurrentVoiceState(voice.connected, voice.muted, !voice.deafened);
	};

	return (
		<>
			{showSettings ? (
				<Settings
					onCancel={() => setShowSettings(false)}
					isMobile={isMobile}
				/>
			) : null}
			<div className={styles.navbar_profile}>
				<div className={styles.navbar_avatar}>
					<Avatar src={user.avatar} />
				</div>
				<div className={styles.navbar_profile_info}>
					<h3>{user.nick}</h3>
					<p
						onClick={(_) =>
							navigator.clipboard.writeText(user.username)
						}
					>
						@{user.username}
					</p>
				</div>
				<div className={styles.navbar_profile_icons}>
					<span className={styles.navbar_profile_icon}>
						{voice.muted ? (
							<MicOffIcon onClick={(_) => toggleMute()} />
						) : (
							<MicIcon onClick={(_) => toggleMute()} />
						)}
					</span>
					{voice.deafened ? (
						<span className={styles.navbar_profile_icon}>
							<HeadsetOffIcon onClick={(_) => toggleDeaf()} />
						</span>
					) : (
						<span className={styles.slighly_off}>
							<HeadsetIcon onClick={(_) => toggleDeaf()} />
						</span>
					)}
					<span className={styles.navbar_profile_icon}>
						<SettingsIcon onClick={(_) => setShowSettings(true)} />
					</span>
				</div>
			</div>
		</>
	);
};
