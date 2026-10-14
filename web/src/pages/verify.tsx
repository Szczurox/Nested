import styles from "@/styles/Auth.module.scss";
import React from "react";
import { useRouter } from "next/router";

export const Verify: React.FC<{}> = ({}) => {
	const router = useRouter();
	return (
		<div className={styles.auth}>
			<div className={styles.center}>
				<h2>Email verification is not required.</h2>
				<button className={styles.auth_button} onClick={() => router.push("/login")}>
					Continue
				</button>
			</div>
		</div>
	);
};

export default Verify;
