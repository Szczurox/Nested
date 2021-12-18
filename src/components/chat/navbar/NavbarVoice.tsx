import React from "react";
import SignalCelluralAltIcon from "@material-ui/icons/SignalCellularAlt";
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import CallIcon from "@material-ui/icons/Call";

export const NavbarVoice: React.FC = ({}) => {
  return (
    <div className="sidebar__voice">
      <SignalCelluralAltIcon className="sidebar__voiceIcon" fontSize="large" />
      <div className="sidebar__voiceInfo">
        <h3>Voice Connected</h3>
        <p>Voice Channel</p>
      </div>
      <div className="sidebar__voiceIcons">
        <InfoOutlinedIcon />
        <CallIcon />
      </div>
    </div>
  );
};
