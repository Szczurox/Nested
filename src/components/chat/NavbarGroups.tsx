import React, { useEffect, useState } from "react";
import styles from "../../styles/components/chat/NavbarGroups.module.scss";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import { NavbarGroup } from "./navbar/NavbarGroup";
import { NavbarVariant } from "./Navbar";
import { useChannel } from "context/channelContext";

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

	const { channel, setGroupData } = useChannel();

	const handleClick = () => {
		variantChange("dms");
		setGroupData("@dms", "\n", "Friends", "", "");
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
				<NavbarGroup
					id="H8cO2zBjCyJYsmM4g5fv"
					isMobile={isMobile}
					icon="https://firebasestorage.googleapis.com/v0/b/faicamp-chat.appspot.com/o/media%2FH8cO2zBjCyJYsmM4g5fv%2Ficon%2F94be048d6c8fb2e759ea2fc0f42e42bb.png?alt=media&token=8adaa6b9-ef54-4858-b17f-ef478d959a85"
				/>
			</div>
		</div>
	);
};
