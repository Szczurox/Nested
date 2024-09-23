import React from "react";
import SignalCelluralAltIcon from "@mui/icons-material/SignalCellularAlt";
import CallIcon from "@mui/icons-material/Call";
import styles from "../../../styles/components/chat/navbar/NavbarVoice.module.scss";
import { useVoice } from "context/voiceContext";
import VoiceChannel from "../VoiceChannel";

export const NavbarVoice: React.FC = ({}) => {
	const { voice, setCurrentRoom } = useVoice();

	const handleDisconnect = () => {
		setCurrentRoom("", "");
	};

	return (
		<div className={styles.voice}>
			<SignalCelluralAltIcon
				className={styles.connection_icon}
				fontSize="large"
			/>
			<div className={styles.info}>
				<h4>{voice.connected ? "Voice Connected" : "Connecting"}</h4>
				<p>Voice Channel</p>
			</div>
			<div className={styles.icons}>
				<CallIcon
					className={styles.icon}
					onClick={() => handleDisconnect()}
				/>
			</div>
			<VoiceChannel />
		</div>
	);
};
