import React, { useState } from "react";
import DotsLoading from "components/animations/DotsLoading";
import styles from "../../../styles/components/chat/Settings.module.scss";
import profStyles from "../../../styles/components/chat/settings/ProfileSettings.module.scss";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { wait } from "components/utils/utils";
import { useUser } from "context/userContext";
import { createFirebaseApp } from "global-utils/clientApp";
import {
	getFirestore,
	getDoc,
	doc,
	deleteDoc,
	updateDoc,
	setDoc,
} from "firebase/firestore";
import { Avatar } from "@mui/material";
import InformationPopUp from "../popup/InformationPopUp";
import { uploadAvatar } from "components/utils/storageQueries";

export const ProfileSettings: React.FC = ({}) => {
	const SignupSchema = Yup.object().shape({
		username: Yup.string()
			.min(2, "Must be between 2 and 32 in length")
			.max(32, "Must be between 2 and 32 in length"),
		nickname: Yup.string()
			.min(2, "Must be between 2 and 32 in length")
			.max(32, "Must be between 2 and 32 in length"),
	});

	const app = createFirebaseApp();
	const db = getFirestore(app!);

	const { user, setProfileData } = useUser();

	const [changed, setChanged] = useState<boolean>(false);
	const [saved, setSaved] = useState<boolean>(false);
	const [display, setDisplay] = useState<string>(user.nick);
	const [name, setName] = useState<string>(user.username);
	const [filePopUp, setFilePopUp] = useState<string>("");
	const [avatar, setAvatar] = useState<string>(user.avatar);
	const [file, setFile] = useState<File>();

	const onSubmit = async (values: any, setFieldError: any) => {
		setSaved(false);
		setChanged(true);
		await wait(1000);
		if (values.username != user.username) {
			const usernameDoc = await getDoc(
				doc(db, "usernames", values.username)
			);
			if (usernameDoc.exists()) {
				setFieldError(
					"username",
					"Account with this username already exists"
				);
				setChanged(false);
				return;
			}
			await deleteDoc(doc(db, "usernames", user.username));
			await updateDoc(doc(db, "profile", user.uid), {
				username: values.username,
			}).then(async () => {
				setProfileData(values.username);
				await setDoc(doc(db, "usernames", values.username), {});
			});
			setChanged(false);
			setSaved(true);
		} else if (values.nickname != user.nick) {
			await updateDoc(doc(db, "profile", user.uid), {
				nick: values.nickname,
			});
			setProfileData(user.username, user.avatar, values.nickname);
		} else if (avatar != user.avatar && file && user.uid) {
			uploadAvatar(file, user.uid);
			setProfileData(user.username, avatar);
		}
		setChanged(false);
		setSaved(true);
	};

	const setAvatarFile = (file: File) => {
		// Allow images and gifs less than 2MB as a pfp
		if (file.size / 1024 / 1024 > 2)
			setFilePopUp("Chosen file exceeded 2MB");
		else if (file.type.substring(0, 5) != "image")
			setFilePopUp("Chosen file is not an image");
		else {
			setFile(file);
			setAvatar(URL.createObjectURL(file));
		}
	};

	const handleChange = (
		type: string,
		e: React.FormEvent<HTMLInputElement>
	) => {
		switch (type) {
			case "username":
				setName(e.currentTarget.value);
				break;
			case "nickname":
				setDisplay(e.currentTarget.value);
			default:
				break;
		}
	};

	return (
		<>
			{filePopUp && (
				<InformationPopUp onOk={() => setFilePopUp("")}>
					{filePopUp}
				</InformationPopUp>
			)}
			<div className={profStyles.profile_container}>
				<div className={profStyles.profile}>
					<div className={profStyles.avatar}>
						<label>
							<input
								type="file"
								value=""
								className={profStyles.upload_avatar}
								onChange={(e) => {
									if (e.target.files)
										setAvatarFile(e.target.files[0]);
								}}
							/>
							<Avatar
								src={avatar}
								sx={{ width: "72px", height: "72px" }}
							/>
						</label>
					</div>
					<div className={profStyles.profile_info}>
						<h2>{display}</h2>
						<p className={profStyles.profile_username}>@{name}</p>
					</div>
				</div>
				<Formik
					initialValues={{
						username: user.username,
						nickname: user.nick,
					}}
					validationSchema={SignupSchema}
					validateOnChange={false}
					validateOnBlur={false}
					onSubmit={(values, { setFieldError }) =>
						onSubmit(values, setFieldError)
					}
				>
					{({ isSubmitting, errors, touched }) => (
						<div>
							<Form>
								<div
									className={
										errors.nickname && touched.nickname
											? styles.element_error
											: "auth_element"
									}
								>
									<p className={styles.data_text}>
										DISPLAY NAME
										{errors.nickname &&
											touched.nickname &&
											" - " + errors.nickname}
									</p>
									<Field
										className={styles.settings_field}
										name="nickname"
										placeholder={user.nick}
										type="nickname"
										autocomplete="off"
										onInput={(
											e: React.FormEvent<HTMLInputElement>
										) => handleChange("nickname", e)}
									/>
								</div>
								<div
									className={
										errors.username && touched.username
											? styles.element_error
											: "auth_element"
									}
								>
									<p className={styles.data_text}>
										USERNAME
										{errors.username &&
											touched.username &&
											" - " + errors.username}
									</p>
									<Field
										className={styles.settings_field}
										name="username"
										placeholder={user.username}
										type="username"
										autocomplete="off"
										onInput={(
											e: React.FormEvent<HTMLInputElement>
										) => handleChange("username", e)}
									/>
								</div>
								<button
									className={styles.save_button}
									disabled={isSubmitting || changed}
									type="submit"
								>
									{changed ? <DotsLoading /> : "Save"}
								</button>
								{saved ? (
									<p className={styles.data_saved}>
										Saved successfully!
										{errors.username &&
											touched.username &&
											" - " + errors.username}
									</p>
								) : null}
							</Form>
						</div>
					)}
				</Formik>
			</div>
		</>
	);
};
