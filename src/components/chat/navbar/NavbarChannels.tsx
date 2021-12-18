import React from "react";
import { NavbarChannel } from "./NavbarChannel";

export type NavbarChannelsVariant = "server" | "dms";

interface NavbarChannelsProps {
  variant?: NavbarChannelsVariant;
}

export const NavbarChannels: React.FC<NavbarChannelsProps> = ({
  variant = "server",
}) => {
  return (
    <div className="sidebar__channels">
      <div className="sidebar__channelsList">
        <NavbarChannel />
      </div>
    </div>
  );
};
