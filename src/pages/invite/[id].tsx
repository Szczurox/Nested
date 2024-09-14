import styles from "../../styles/Auth.module.scss";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { createFirebaseApp } from "firebase-utils/clientApp";
import { useSearchParams } from "next/navigation";
import { useUser } from "context/userContext";

export const Invite: React.FC<{}> = ({}) => {
	const router = useRouter();
	const params = useSearchParams();
	const { id } = router.query;

	const { user } = useUser();

	const [guildId, setGuildId] = useState<string>(params.get("id") as string);
	const [invite, setInvite] = useState<string>();

	const app = createFirebaseApp();
	const db = getFirestore(app!);

	useEffect(() => {
		if (!router.isReady) return;
		if (user.uid == "" || !user.verified) router.push("/chat");
		setInvite(id as string);
		setGuildId(params.get("id") as string);
		var storedGroups = localStorage.getItem("groups")
			? JSON.parse(localStorage.getItem("groups")!)
			: [];

		if (storedGroups.includes(params.get("id") as string))
			router.push(`/chat/${params.get("id") as string}`, undefined, {
				shallow: true,
			});
	}, [id, router, params, guildId]);

	const click = async () => {
		var storedGroups = localStorage.getItem("groups")
			? JSON.parse(localStorage.getItem("groups")!)
			: [];
		console.log(guildId);
		if (!storedGroups.includes(guildId) && guildId) {
			const memberDoc = doc(db, "groups", guildId, "members", user.uid);
			try {
				const member = await getDoc(memberDoc);
				console.log(member.exists());
				if (member.exists()) {
					await setDoc(
						doc(db, "profile", user.uid, "groups", guildId),
						{}
					);
					router.push(`/chat/${guildId}`, undefined, {
						shallow: true,
					});
				}
			} catch {
				await setDoc(memberDoc, {
					nickname: user.username,
					avatar: user.avatar,
					nameColor: "",
					permissions: [],
					invite: invite,
				}).then(async () => {
					await setDoc(
						doc(db, "profile", user.uid, "groups", guildId),
						{}
					)
						.then(() => {
							router.push(`/chat/${guildId}`, undefined, {
								shallow: true,
							});
						})
						.catch((e) => console.log(e));
				});
			}
		} else {
			router.push(`/chat/${guildId}`, undefined, { shallow: true });
		}
	};

	return (
		<div className={styles.auth}>
			<div className={styles.center}>
				<h3>Invited to a server</h3>
				<button className={styles.auth_button} onClick={() => click()}>
					Accept invite
				</button>
			</div>
		</div>
	);
};

export default Invite;
