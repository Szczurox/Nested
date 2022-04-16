import React, { useState } from "react";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import AddIcon from "@material-ui/icons/Add";
import styles from "../../../styles/components/chat/navbar/NavbarCategory.module.scss";
import { NavbarChannel } from "./NavbarChannel";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";

export type NavbarCategoryVariant = "server" | "dms";

interface NavbarCategoryProps {
  id: string;
  variant?: NavbarCategoryVariant;
  name: String;
}

export const NavbarCategory: React.FC<NavbarCategoryProps> = ({
  id,
  name,
  variant = "server",
}) => {
  let body = null;
  const [showChannels, setShowChannels] = useState(true);

  if (variant === "server") {
    body = (
      <div
        className={styles.navbar_header}
        onClick={() => setShowChannels(!showChannels)}
      >
        {showChannels ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        <h4>{name}</h4>
      </div>
    );
  } else {
    body = (
      <div className={styles.navbar_header}>
        <h4>DIRECT MESSAGES</h4>
      </div>
    );
  }

  return (
    <div className="navbar_category" id={id}>
      <div className={styles.navbar_channelsHeader}>
        {body}
        <AddIcon className={styles.navbar_addChannel} />
      </div>
      <div
        className="navbar_channels"
        style={{
          height: showChannels ? "auto" : "0px",
          visibility: showChannels ? "visible" : "hidden",
        }}
      >
        <NavbarChannel name="ass" id="1"></NavbarChannel>
        <NavbarChannel name="test" id="2"></NavbarChannel>
      </div>
    </div>
  );
};
