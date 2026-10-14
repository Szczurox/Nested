import styles from "@/styles/Auth.module.scss";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { serverRequest } from "@/global-utils/serverClient";
import { useUser } from "@/context/userContext";

export const Invite: React.FC<{}> = ({}) => {
	const router = useRouter();
	const { id } = router.query;

	const { user, loadingUser } = useUser();

	const [guildId, setGuildId] = useState<string>("");
	const [invite, setInvite] = useState<string>();

	useEffect(() => {
		if (!router.isReady) return;
		const groupId =
			typeof router.query.groupId === "string"
				? router.query.groupId
				: "";
		if (user.uid == "" && !loadingUser) {
			router.push(
				`/login?ref=/invite/${id as string}&groupId=${groupId}`
			);
			return;
		}
		setInvite(id as string);
		setGuildId(groupId);
	}, [id, router.isReady, router.query.groupId, user.uid, loadingUser]);

	const click = async () => {
		if (!guildId || !invite) return;
		try {
			await serverRequest(`/api/groups/${guildId}/invites/${invite}/accept`, { method: "POST" });
			router.push(`/chat/${guildId}`, undefined, { shallow: true });
		} catch (error) {
			console.error("Unable to accept invite", error);
		}
	};

	return (
		<div className={styles.auth}>
			<div className={styles.center}>
				<h2>Invited to a group</h2>
				<button className={styles.auth_button} onClick={() => click()}>
					Accept invite
				</button>
			</div>
		</div>
	);
};

export default Invite;
