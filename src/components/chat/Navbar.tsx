import React from "react";
import { NavbarHeader } from "./navbar/NavbarHeader";
import { NavbarVoice } from "./navbar/NavbarVoice";
import { NavbarProfile } from "./navbar/NavbarProfile";
import styles from "../../styles/components/chat/Navbar.module.scss";
import { NavbarCategories } from "./navbar/NavbarCategories";
import { useVoice } from "context/voiceContext";

export type NavbarVariant = "server" | "dms";

interface NavbarProps {
	isMobile: boolean;
	variant?: NavbarVariant;
}

export const Navbar: React.FC<NavbarProps> = ({
	isMobile,
	variant = "server",
}) => {
	const { voice } = useVoice();

	return (
		<div className={styles.navbar}>
			<NavbarHeader variant={variant} />
			<NavbarCategories variant={variant} />
			{voice.room && <NavbarVoice />}
			<NavbarProfile isMobile={isMobile} />
		</div>
	);
};
