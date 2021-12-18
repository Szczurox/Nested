import React from "react";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

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
        <ExpandMoreIcon />
        <h4>Text Channels</h4>
      </>
    );
  } else {
    body = (
      <div className="search">
        <input placeholder="Search" />
      </div>
    );
  }
  return <div className="sidebar__header">{body}</div>;
};
