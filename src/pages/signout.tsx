import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { getAuth, signOut } from "firebase/auth";

export const Invite: React.FC<{}> = ({}) => {
	const router = useRouter();

	useEffect(() => {
		const auth = getAuth();
		signOut(auth)
			.then(() => {
				console.log("signed out");
				router.push("/login");
			})
			.catch((error) => console.log("SIGN OUT ERROR: " + error.message));
	}, [router]);

	return <></>;
};

export default Invite;
