import React, { useEffect, useState } from "react";
import styles from "../../styles/components/chat/NavbarGroups.module.scss";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import { NavbarGroup } from "./navbar/NavbarGroup";
import { NavbarVariant } from "./Navbar";
import { useChannel } from "context/channelContext";
import { createFirebaseApp } from "firebase-utils/clientApp";
import {
	getFirestore,
	collection,
	query,
	onSnapshot,
} from "firebase/firestore";
import { useUser } from "context/userContext";
import { useRouter } from "next/router";

interface NavbarGroupsProps {
	variantChange: (variant: NavbarVariant) => void;
	isMobile: boolean;
}

export const NavbarGroups: React.FC<NavbarGroupsProps> = ({
	variantChange,
	isMobile,
}) => {
	const [variant, setVariant] = useState<boolean>(true);
	const [isHovering, setIsHovering] = useState<boolean>(true);
	const [groups, setGroups] = useState<string[]>([]);

	const router = useRouter();
	const { channel } = useChannel();
	const { user } = useUser();

	const app = createFirebaseApp();
	const db = getFirestore(app!);

	const handleClick = () => {
		variantChange("dms");
		router.push("/chat/@dms");
		setVariant(false);
	};

	useEffect(() => {
		if (channel.idG == "@dms") {
			variantChange("dms");
			setVariant(false);
		} else {
			setVariant(true);
			variantChange("server");
		}
	}, [channel.idG, variantChange]);

	useEffect(() => {
		async function getGroups() {
			const groupsCollection = collection(
				db,
				"profile",
				user.uid,
				"groups"
			);
			// Groups query
			const qG = query(groupsCollection);

			const unsub = onSnapshot(qG, (querySnapshot) => {
				querySnapshot.docChanges().forEach((change) => {
					if (
						change.type === "removed" ||
						change.type === "modified"
					) {
						setGroups((groups) =>
							[
								...groups.filter((el) => el !== change.doc.id),
							].sort()
						);
					}
					if (change.type === "added" || change.type === "modified") {
						setGroups((groups) =>
							[
								...groups.filter((el) => el !== change.doc.id),
								change.doc.id,
							].sort()
						);
					}
				});
			});

			return unsub;
		}

		console.log(user.uid);
		if (user.uid != "") getGroups();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user.uid]);

	useEffect(() => {
		localStorage.setItem("groups", JSON.stringify(groups));
	}, [groups]);

	return (
		<div className={styles.navbar_groups}>
			<div
				className={styles.navbar_groups_chat}
				onClick={() => handleClick()}
				style={
					variant
						? {}
						: isHovering
						? { borderRadius: "8px", backgroundColor: "#5d6569" }
						: { borderRadius: "8px", backgroundColor: "#51575a" }
				}
				onMouseEnter={() => setIsHovering(true)}
				onMouseLeave={() => setIsHovering(false)}
			>
				<ChatBubbleIcon />
			</div>
			<hr className={styles.navbar_groups_separator} />
			<div className={styles.navbar_groups_groups}>
				{groups.map((group) => (
					<NavbarGroup id={group} isMobile={isMobile} key={group} />
				))}
			</div>
		</div>
	);
};
