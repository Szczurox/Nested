import React from "react";
import styles from "../../styles/components/chat/NavbarGroups.module.scss";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import { NavbarGroup } from "./navbar/NavbarGroup";

export type NavbarGroupsVariant = "server" | "dms";

interface NavbarGroupsProps {
  variant?: NavbarGroupsVariant;
  isMobile: boolean;
}

export const NavbarGroups: React.FC<NavbarGroupsProps> = ({
  variant = "server",
  isMobile,
}) => {
  return (
    <div className={styles.navbar_groups}>
      <div className={styles.navbar_groups_chat}>
        <ChatBubbleIcon />
      </div>
      <hr className={styles.navbar_groups_separator} />
      <div className={styles.navbar_groups_groups}>
        <NavbarGroup id="" isMobile={isMobile} />
      </div>
    </div>
  );
};
