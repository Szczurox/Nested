import React, { useState } from "react";
import DotsLoading from "@/components/animations/DotsLoading";
import styles from "@/styles/components/chat/Settings.module.scss";
import profStyles from "@/styles/components/chat/settings/ProfileSettings.module.scss";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { wait } from "@/components/utils/utils";
import { useUser } from "@/context/userContext";
import { Avatar } from "@mui/material";
import { uploadAvatar } from "@/components/utils/storageQueries";
import { serverRequest } from "@/global-utils/serverClient";
import InformationPopUp from "@/components/chat/popup/InformationPopUp";
import EditIcon from "@mui/icons-material/Edit";

export const ProfileSettings: React.FC = ({}) => {
	const SignupSchema = Yup.object().shape({
		username: Yup.string()
			.min(2, "Must be between 2 and 32 in length")
			.max(32, "Must be between 2 and 32 in length"),
		nickname: Yup.string()
			.min(2, "Must be between 2 and 32 in length")
			.max(32, "Must be between 2 and 32 in length"),
	});

	const { user, setProfileData } = useUser();

	const [changed, setChanged] = useState<boolean>(false);
	const [saved, setSaved] = useState<boolean>(false);
	const [showEdit, setShowEdit] = useState<boolean>(false);
	const [display, setDisplay] = useState<string>(user.nick);
	const [name, setName] = useState<string>(user.username);
	const [filePopUp, setFilePopUp] = useState<string>("");
	const [avatar, setAvatar] = useState<string>(user.avatar);
	const [file, setFile] = useState<File>();

	const onSubmit = async (values: any, setFieldError: any) => {
		setSaved(false);
		setChanged(true);
		await wait(1000);
		try {
			let profile: { username: string; nickname: string; avatarUrl: string | null } = {
				username: user.username, nickname: user.nick, avatarUrl: user.avatar,
			};
			if (values.username !== user.username || values.nickname !== user.nick) {
				const response = await serverRequest<{ user: { username: string; nickname: string; avatarUrl: string | null } }>(
					"/api/profile",
					{
						method: "PATCH",
						body: JSON.stringify({
							...(values.username !== user.username ? { username: values.username } : {}),
							...(values.nickname !== user.nick ? { nickname: values.nickname } : {}),
						}),
					}
				);
				profile = response.user;
			}
			setProfileData(profile.username, profile.avatarUrl ?? user.avatar, profile.nickname);
			if (file) {
				const avatarResponse = await uploadAvatar(file);
				setProfileData(profile.username, avatarResponse.user.avatarUrl ?? user.avatar, profile.nickname);
			}
		} catch (error) {
			const status = error as Error & { status?: number };
			if (status.status === 409) setFieldError("username", "Account with this username already exists");
			else console.error("Unable to update profile", error);
			setChanged(false);
			return;
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
					{showEdit && <EditIcon className={profStyles.edit} />}
					<div
						className={profStyles.avatar}
						onMouseEnter={() => setShowEdit(true)}
						onMouseLeave={() => setShowEdit(false)}
					>
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
										autoComplete="off"
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
										autoComplete="off"
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
								{saved && (
									<p className={styles.data_saved}>
										Saved successfully!
										{errors.username &&
											touched.username &&
											" - " + errors.username}
									</p>
								)}
							</Form>
						</div>
					)}
				</Formik>
			</div>
		</>
	);
};
