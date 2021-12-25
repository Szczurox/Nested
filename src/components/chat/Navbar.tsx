import React from "react";
import { NavbarHeader } from "./navbar/NavbarHeader";
import { NavbarVoice } from "./navbar/NavbarVoice";
import { NavbarProfile } from "./navbar/NavbarProfile";
import styles from "../../styles/components/chat/Navbar.module.scss";
import { NavbarChannels } from "./navbar/NavbarChannels";

export type NavbarVariant = "server" | "dms";

interface NavbarProps {
  variant?: NavbarVariant;
}

export const Navbar: React.FC<NavbarProps> = ({
  children,
  variant = "server",
}) => {
  return (
    <div className={styles.navbar}>
      <NavbarHeader variant={variant === "server" ? "server" : "dms"} />
      <NavbarChannels />
      <NavbarVoice />
      <NavbarProfile />
    </div>
  );
};
