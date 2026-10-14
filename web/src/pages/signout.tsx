import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { serverRequest } from "@/global-utils/serverClient";

export const SignOut: React.FC<{}> = ({}) => {
	const router = useRouter();

	useEffect(() => {
		serverRequest("/api/auth/logout", { method: "POST" }).finally(() =>
			router.push("/login"),
		);
	}, [router]);

	return <></>;
};

export default SignOut;
