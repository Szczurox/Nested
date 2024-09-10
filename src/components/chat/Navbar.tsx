import React, { useState } from "react";
import { NavbarHeader } from "./navbar/NavbarHeader";
import { NavbarVoice } from "./navbar/NavbarVoice";
import { NavbarProfile } from "./navbar/NavbarProfile";
import styles from "../../styles/components/chat/Navbar.module.scss";
import { NavbarCategories } from "./navbar/NavbarCategories";

export type NavbarVariant = "server" | "dms";

interface NavbarProps {
	isMobile: boolean;
	variant?: NavbarVariant;
}

export const Navbar: React.FC<NavbarProps> = ({
	isMobile,
	variant = "server",
}) => {
	const [isVoiceConnected, setIsVoiceConnected] = useState(false);

	return (
		<div className={styles.navbar}>
			<NavbarHeader variant={variant} />
			<NavbarCategories variant={variant} />
			{isVoiceConnected ? <NavbarVoice /> : null}
			<NavbarProfile isMobile={isMobile} />
		</div>
	);
};
