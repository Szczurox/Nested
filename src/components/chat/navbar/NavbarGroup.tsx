import styles from "../../../styles/components/chat/navbar/NavbarGroup.module.scss";
import { useChannel } from "context/channelContext";
import GroupsIcon from "@mui/icons-material/Groups";
import { Avatar } from "@mui/material";
import { useEffect, useState } from "react";
import { onSnapshot, doc, getFirestore } from "firebase/firestore";
import { createFirebaseApp } from "global-utils/clientApp";
import { useRouter } from "next/router";

interface NavbarGroupProps {
	isMobile: boolean;
	icon?: string;
	id: string;
}

export const NavbarGroup: React.FC<NavbarGroupProps> = ({ id, isMobile }) => {
	const { channel, setGroupData } = useChannel();

	const router = useRouter();

	const [icon, setIcon] = useState<string>("");
	const [name, setName] = useState<string>("");
	const [isSelected, setIsSelected] = useState<boolean>(false);
	const [isHover, setIsHover] = useState<boolean>(false);

	const app = createFirebaseApp();
	const db = getFirestore(app!);

	const handleToggle = () => {
		if (!isSelected)
			router.push(`/chat/${id}`, undefined, { shallow: true });
		if (isSelected && isMobile) setIsHover(false);
	};

	useEffect(() => {
		if (channel.idG == id && name != channel.nameG) {
			setGroupData(id, channel.id, name);
			setIsSelected(true);
		} else setIsSelected(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [channel.idG, id, name]);

	useEffect(() => {
		function onLoad() {
			return onSnapshot(doc(db, "groups", id), (doc) => {
				if (doc.exists()) {
					setIcon(doc.data().icon);
					setName(doc.data().name);
				}
			});
		}

		const unsub = onLoad();
		return () => unsub();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div
			className={styles.navbar_group}
			style={
				isSelected
					? { border: "2px solid white" }
					: isHover
					? { border: "2px solid grey" }
					: {}
			}
			onClick={handleToggle}
			onMouseEnter={() => setIsHover(true)}
			onMouseLeave={() => setIsHover(false)}
		>
			<Avatar
				src={icon}
				className={styles.navbar_group_icon}
				variant="square"
			>
				<GroupsIcon />
			</Avatar>
		</div>
	);
};
