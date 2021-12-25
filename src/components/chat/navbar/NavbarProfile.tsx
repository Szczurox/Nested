import React from "react";
import Avatar from "@material-ui/core/Avatar";
import MicIcon from "@material-ui/icons/Mic";
import HeadsetIcon from "@material-ui/icons/Headset";
import SettingsIcon from "@material-ui/icons/Settings";
import styles from "../../../styles/components/chat/navbar/NavbarProfile.module.scss";

export const NavbarProfile: React.FC = ({}) => {
  return (
    <div className={styles.navbar_profile}>
      <Avatar src="https://avatars.githubusercontent.com/u/58273015?s=48" />
      <div className={styles.navbar_profileInfo}>
        <h3>Username</h3>
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
