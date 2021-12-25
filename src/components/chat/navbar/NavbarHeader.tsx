import React from "react";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import styles from "../../../styles/components/chat/navbar/NavbarHeader.module.scss";

export type NavbarHeaderVariant = "server" | "dms";

interface NavbarHeaderProps {
  variant?: NavbarHeaderVariant;
}

export const NavbarHeader: React.FC<NavbarHeaderProps> = ({
  variant = "server",
}) => {
  let body = null;

  if (variant === "server") {
    body = (
      <>
        <h4>Text Channels</h4>
        <ExpandMoreIcon />
      </>
    );
  } else {
    body = (
      <div className="search">
        <input placeholder="Search" />
      </div>
    );
  }
  return <div className={styles.sidebar_header}>{body}</div>;
};
