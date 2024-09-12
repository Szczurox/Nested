import styles from "../../../styles/components/chat/navbar/NavbarGroup.module.scss";
import { useChannel } from "context/channelContext";
import GroupsIcon from "@mui/icons-material/Groups";
import { Avatar } from "@mui/material";
import { useEffect, useState } from "react";

interface NavbarGroupProps {
	isMobile: boolean;
	icon?: string;
	id: string;
}

export const NavbarGroup: React.FC<NavbarGroupProps> = ({
	id,
	icon = "",
	isMobile,
}) => {
	const { channel, setGroupData } = useChannel();
	const [isSelected, setIsSelected] = useState<boolean>(false);
	const [isHover, setIsHover] = useState<boolean>(false);

	// const { user } = useUser();

	// const app = createFirebaseApp();
	// const db = getFirestore(app!);

	// Not necessary for now (check channel.tsx)
	/*
	const getLastViewed = async () => {
		const memberDoc = doc(db, "groups", id, "members", user.uid);
		const docSnapMember = await getDoc(memberDoc);
		if (docSnapMember.exists())
			setGroupData(id, docSnapMember.data().lastViewed);
	};*/

	const handleToggle = () => {
		console.log(id);
		if (!isSelected) setGroupData(id);
		if (isSelected && isMobile) setIsHover(false);
	};

	useEffect(() => {
		if (channel.idG == id) setIsSelected(true);
		else setIsSelected(false);
	}, [channel.idG, id]);

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
