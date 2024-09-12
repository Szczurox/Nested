import styles from "../styles/Auth.module.scss";
import React, { useEffect, useState } from "react";
import { useUser } from "context/userContext";
import { useRouter } from "next/router";
import { getAuth, signOut } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import { createFirebaseApp } from "firebase-utils/clientApp";
import { handleVerifyEmail } from "components/utils/actionQueries";

export const Verify: React.FC<{}> = ({}) => {
	const { user } = useUser();
	const [mode, setMode] = useState<string>("");
	const searchParams = useSearchParams();

	const router = useRouter();
	useEffect(() => {
		const mod: string = searchParams.get("mode") as string;
		const action: string = searchParams.get("obbCode") as string;

		console.log(mod, action);

		const app = createFirebaseApp();
		const auth = getAuth(app!);

		setMode(mod);

		switch (mod) {
			case "waitForVerify":
				break;
			case "resetPassword":
				console.log("couldn't reset password");
				break;
			case "recoverEmail":
				console.log("couldn't recover email");
				break;
			case "verifyEmail":
				handleVerifyEmail(auth, action);
				break;
			default:
				console.log(`Wrong argument "mode" = "${mode}" for /verify`);
				break;
		}
	}, [searchParams, mode]);

	const click = () => {
		if (user.verified) {
			const app = createFirebaseApp();
			const auth = getAuth(app!);
			signOut(auth).then(() => router.push("/login"));
		}
	};

	return mode == "waitForVerify" || mode == "verifyEmail" ? (
		<div className={styles.auth}>
			<div className={styles.center}>
				{mode == "waitForVerify" ? (
					<h3>Verification link has been sent to your email</h3>
				) : (
					<h3>Successfully verified email address!</h3>
				)}
				<button className={styles.auth_button} onClick={() => click()}>
					Continue
				</button>
			</div>
		</div>
	) : null;
};

export default Verify;
