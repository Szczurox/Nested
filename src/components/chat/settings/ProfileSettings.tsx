import React, { useState } from "react";
import DotsLoading from "components/animations/DotsLoading";
import styles from "../../../styles/components/chat/Settings.module.scss";
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

	const { user, setUserData } = useUser();

	const [changed, setChanged] = useState<boolean>(false);
	const [saved, setSaved] = useState<boolean>(false);

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
				setUserData(
					user.token,
					user.uid,
					values.username,
					user.avatar,
					user.nick
				);
				await setDoc(doc(db, "usernames", values.username), {});
			});
			setChanged(false);
			setSaved(true);
		} else if (values.nickname != user.nick) {
			await updateDoc(doc(db, "profile", user.uid), {
				nick: values.nickname,
			});
			setUserData(
				user.token,
				user.uid,
				user.username,
				user.avatar,
				values.nickname
			);
		}
		setChanged(false);
		setSaved(true);
	};

	return (
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
			)}
		</Formik>
	);
};
