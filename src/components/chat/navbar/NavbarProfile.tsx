import React, { useState } from "react";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import HeadsetIcon from "@mui/icons-material/Headset";
import HeadsetOffIcon from "@mui/icons-material/HeadsetOff";
import SettingsIcon from "@mui/icons-material/Settings";
import styles from "../../../styles/components/chat/navbar/NavbarProfile.module.scss";
import { useUser } from "context/userContext";
import {
	getDownloadURL,
	getStorage,
	ref,
	uploadBytesResumable,
} from "firebase/storage";
import { createFirebaseApp } from "../../../firebase-utils/clientApp";
import { doc, getFirestore, updateDoc } from "firebase/firestore";
import { useChannel } from "context/channelContext";
import Settings from "../Settings";
import { Avatar } from "@mui/material";

interface NavbarProfileProps {
	isMobile: boolean;
}

export const NavbarProfile: React.FC<NavbarProfileProps> = ({ isMobile }) => {
	const { user, setUserData, setVoiceData } = useUser();
	const { channel } = useChannel();

	const [showSettings, setShowSettings] = useState<boolean>(false);
	const [avatar, setAvatar] = useState<string>(
		user.avatar ? user.avatar : "/UserAvatar.png"
	);

	const storage = getStorage();
	const app = createFirebaseApp();
	const db = getFirestore(app!);

	async function fileSubmit(url: string) {
		await updateDoc(doc(db, "profile", user.uid), {
			avatar: url,
		})
			.catch((err) => console.log("User Error: " + err))
			.then(
				async () =>
					await updateDoc(
						doc(db, "groups", channel.idG, "members", user.uid),
						{
							avatar: url,
						}
					).catch((err) => console.log("Member Error: " + err))
			);
	}

	const uploadAvatar = (file: File) => {
		// Allow images and gifs less than 2MB as a pfp
		if (
			file.type.substring(0, 5) == "image" &&
			file.size / 1024 / 1024 < 2
		) {
			const fileRef = ref(storage, `profiles/${user.uid}`);
			const uploadTask = uploadBytesResumable(fileRef, file!);
			uploadTask.on(
				"state_changed",
				(snapshot) => {
					const progress =
						(snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
				},
				() => {
					getDownloadURL(uploadTask.snapshot.ref).then(
						(downloadURL) => {
							console.log("Avatar uploaded! ", downloadURL);
							fileSubmit(downloadURL).then(() => {
								setAvatar(downloadURL);
								setUserData(
									user.token,
									user.uid,
									user.username,
									downloadURL,
									user.nick
								);
							});
						}
					);
				}
			);
		}
	};

	const toggleMute = () => {
		setVoiceData(!user.muted, user.deafened);
	};

	const toggleDeaf = () => {
		setVoiceData(user.muted, !user.deafened);
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
					<label>
						<input
							type="file"
							value=""
							className={styles.navbar_upload_avatar}
							onChange={(e) => {
								if (e.target.files)
									uploadAvatar(e.target.files[0]);
							}}
						/>
						<Avatar src={avatar} />
					</label>
				</div>
				<div className={styles.navbar_profile_info}>
					<h3>{user.nick}</h3>
					<p
						onClick={(_) =>
							navigator.clipboard.writeText("@" + user.username)
						}
					>
						@{user.username}
					</p>
				</div>
				<div className={styles.navbar_profile_icons}>
					<span className={styles.navbar_profile_icon}>
						{user.muted ? (
							<MicOffIcon onClick={(_) => toggleMute()} />
						) : (
							<MicIcon onClick={(_) => toggleMute()} />
						)}
					</span>
					{user.deafened ? (
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
