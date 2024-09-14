import React, { useEffect } from "react";
import { useRouter } from "next/router";

export const Invite: React.FC<{}> = ({}) => {
	const router = useRouter();

	useEffect(() => {
		router.push("/chat/@dms");
	}, [router]);

	return <></>;
};

export default Invite;
