import React from "react";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import AddIcon from "@material-ui/icons/Add";

export type NavbarCategoryVariant = "server" | "dms";

interface NavbarCategoryProps {
  variant?: NavbarCategoryVariant;
}

export const NavbarCategory: React.FC<NavbarCategoryProps> = ({
  variant = "server",
}) => {
  let body = null;

  if (variant === "server") {
    body = (
      <div className="sidebar__header">
        <ExpandMoreIcon />
        <h4>Text Channels</h4>
      </div>
    );
  } else {
    body = (
      <div className="sidebar__header">
        <h4>DIRECT MESSAGES</h4>
      </div>
    );
  }

  return (
    <div className="sidebar_channelsHeader">
      {body}
      <AddIcon className="sidebar_addChannel" />
    </div>
  );
};
