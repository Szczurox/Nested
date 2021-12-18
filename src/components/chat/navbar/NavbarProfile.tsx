import React from "react";
import Avatar from "@material-ui/core/Avatar";
import MicIcon from "@material-ui/icons/Mic";
import HeadsetIcon from "@material-ui/icons/Headset";
import SettingsIcon from "@material-ui/icons/Settings";

export const NavbarProfile: React.FC = ({}) => {
  return (
    <div className="sidebar__profile">
      <Avatar src="https://avatars.githubusercontent.com/u/58273015?s=48" />
      <div className="sidebar__profileInfo">
        <h3>Username</h3>
        <p>#0000</p>
      </div>
      <div className="sidebar__profileIcons">
        <MicIcon />
        <HeadsetIcon />
        <SettingsIcon />
      </div>
    </div>
  );
};
