import React, { useEffect, useRef, useState } from "react";
import styles from "../../styles/components/chat/Settings.module.scss";
import ScreenPopUp from "./popup/ScreenPopUp";
import CloseIcon from "@material-ui/icons/Close";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { useUser } from "context/userContext";
import { getAuth, signOut } from "firebase/auth";
import {
	deleteDoc,
	doc,
	getDoc,
	getFirestore,
	setDoc,
	updateDoc,
} from "firebase/firestore";
import { createFirebaseApp } from "firebase-utils/clientApp";
import DotsLoading from "components/animations/DotsLoading";
import { wait } from "components/utils/utils";

export interface SettingsProps {
	onCancel: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onCancel }) => {
	const SignupSchema = Yup.object().shape({
		username: Yup.string()
			.min(2, "Must be between 2 and 32 in length")
			.max(32, "Must be between 2 and 32 in length"),
	});

	const app = createFirebaseApp();
	const db = getFirestore(app!);

	const { user, setUserData } = useUser();

	const [active, setActive] = useState<string>("profile");
	const [changed, setChanged] = useState<boolean>(false);
	const [saved, setSaved] = useState<boolean>(false);

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

	const onSubmit = async (values: any, setFieldError: any) => {
		setSaved(false);
		setChanged(true);
		await wait(400);
		if (values.username == user.username) {
			setSaved(true);
			setChanged(false);
			return;
		}
		const usernameDoc = await getDoc(doc(db, "usernames", values.username));
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
				user.tag
			);
			await setDoc(doc(db, "usernames", values.username), {});
		});
		setChanged(false);
		setSaved(true);
	};

	return (
		<ScreenPopUp full={true}>
			<div className={styles.settings}>
				<div className={styles.container}>
					<div className={styles.navbar}>
						<div
							className={`${styles.navbar_setting} ${
								active == "profile" ? styles.active : ""
							}`}
							id="profile"
							onClick={(e) => setActive(e.currentTarget.id)}
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
					<div className={styles.content}>
						<Formik
							initialValues={{
								username: user.username,
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
											errors.username && touched.username
												? styles.element_error
												: "auth_element"
										}
									>
										<p className={styles.data_text}>
											USERNAME
											{errors.username && touched.username
												? " - " + errors.username
												: null}
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
											{errors.username && touched.username
												? " - " + errors.username
												: null}
										</p>
									) : null}
								</Form>
							)}
						</Formik>
					</div>
					<div className={styles.close}>
						<CloseIcon onClick={() => onCancel()} />
					</div>
				</div>
			</div>
		</ScreenPopUp>
	);
};

export default Settings;
