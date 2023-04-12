import React from "react";
import Avatar from "@material-ui/core/Avatar";
import MicIcon from "@material-ui/icons/Mic";
import HeadsetIcon from "@material-ui/icons/Headset";
import SettingsIcon from "@material-ui/icons/Settings";
import styles from "../../../styles/components/chat/navbar/NavbarProfile.module.scss";
import { useUser } from "context/userContext";

export const NavbarProfile: React.FC = ({}) => {
  const { user } = useUser();

  return (
    <div className={styles.navbar_profile}>
      <Avatar src="https://www.pngall.com/wp-content/uploads/5/User-Profile-PNG-High-Quality-Image.png" />
      <div className={styles.navbar_profileInfo}>
        <h3>{user.username}</h3>
        <p>#0000</p>
      </div>
      <div className={styles.navbar_profileIcons}>
        <MicIcon />
        <HeadsetIcon />
        <SettingsIcon />
      </div>
    </div>
  );
};
