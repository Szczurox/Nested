import styles from "@/styles/components/chat/navbar/NavbarGroup.module.scss";
import { useChannel } from "@/context/channelContext";
import GroupsIcon from "@mui/icons-material/Groups";
import { Avatar } from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { serverRequest } from "@/global-utils/serverClient";

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

	const handleToggle = () => {
		if (!isSelected)
			router.push(`/chat/${id}`, undefined, { shallow: true });
		if (isSelected && isMobile) setIsHover(false);
	};

	useEffect(() => {
		if (channel.idG == id && name != channel.nameG) {
			setGroupData(id, channel.id, name, icon);
			setIsSelected(true);
		} else setIsSelected(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [channel.idG, id, name]);

	useEffect(() => {
		serverRequest<{
			group: { name: string; icon?: string | null };
		}>(`/api/groups/${id}`)
			.then(({ group }) => {
				setIcon(group.icon ?? "");
				setName(group.name);
			})
			.catch((error) => console.error("Unable to load group", error));
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
				src={icon || undefined}
				className={styles.navbar_group_icon}
				variant="square"
				sx={{
					width: "100%",
					height: "100%",
					padding: 0,
					margin: 0,
					boxSizing: "border-box",
					"& img": {
						display: "block",
						width: "100%",
						height: "100%",
						objectFit: "cover",
						objectPosition: "center",
					},
				}}
			>
				<GroupsIcon />
			</Avatar>
		</div>
	);
};
