import React, { useEffect } from "react";
import SignalCelluralAltIcon from "@mui/icons-material/SignalCellularAlt";
import CallIcon from "@mui/icons-material/Call";
import styles from "../../../styles/components/chat/navbar/NavbarVoice.module.scss";
import { useVoice } from "context/voiceContext";
import VoiceChannel from "../VoiceChannel";
import DotsLoading from "components/animations/DotsLoading";

export const NavbarVoice: React.FC = ({}) => {
	const { voice, setCurrentRoom } = useVoice();

	const handleDisconnect = () => {
		setCurrentRoom("", "");
	};

	return (
		<div className={styles.voice}>
			{voice.connected ? (
				<SignalCelluralAltIcon
					className={styles.connection_icon}
					fontSize="large"
				/>
			) : (
				<div className={styles.dots_connecting}>
					<DotsLoading />
				</div>
			)}
			<div className={styles.info}>
				<h4
					className={
						voice.connected ? styles.connected : styles.connecting
					}
				>
					{voice.connected ? "Voice Connected" : "Connecting"}
				</h4>
				<p>{voice.roomName}</p>
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
