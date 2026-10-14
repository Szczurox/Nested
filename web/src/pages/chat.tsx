import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/context/userContext";

export const ChatIndex: React.FC<{}> = ({}) => {
	const router = useRouter();
	const { user, loadingUser } = useUser();

	useEffect(() => {
		if (loadingUser) return;
		if (user.uid === "") router.push("/login");
		else router.push("/chat/@dms");
	}, [user.uid, loadingUser, router]);

	return null; // Or a simple loading indicator while it checks
};

export default ChatIndex;
