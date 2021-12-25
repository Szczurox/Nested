import React from "react";
import { NavbarChannel } from "./NavbarChannel";
import styles from "../../../styles/components/chat/navbar/NavbarChannels.module.scss";

export type NavbarChannelsVariant = "server" | "dms";

interface NavbarChannelsProps {
  variant?: NavbarChannelsVariant;
}

export const NavbarChannels: React.FC<NavbarChannelsProps> = ({
  variant = "server",
}) => {
  return (
    <div className={styles.navbar_channels}>
      <NavbarChannel name="dupa123" />
    </div>
  );
};
