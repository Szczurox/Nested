import React, { useEffect } from "react";
import { useUser } from "context/userContext";
import { useRouter } from "next/router";
import styles from "../styles/Auth.module.scss";
import { getAuth, signOut } from "firebase/auth";

export const Verify: React.FC<{}> = ({}) => {
	const { user, loadingUser } = useUser();
	const router = useRouter();

	useEffect(() => {
		// Route to chat if user is verified
		if (user.uid != "" && !loadingUser && user.verified)
			router.push("/chat");
	});

	const click = () => {
		const auth = getAuth();
		signOut(auth).then(() => router.push("/login"));
	};

	return (
		<div className={styles.auth}>
			<div className={styles.center}>
				<h3>Verification link has been sent to your email</h3>
				<button className={styles.auth_button} onClick={() => click()}>
					Continue
				</button>
			</div>
		</div>
	);
};

export default Verify;
