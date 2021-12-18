import React from "react";
import { NavbarHeader } from "./navbar/NavbarHeader";
import { NavbarVoice } from "./navbar/NavbarVoice";
import { NavbarProfile } from "./navbar/NavbarProfile";

export type NavbarVariant = "server" | "dms";

interface NavbarProps {
  variant?: NavbarVariant;
}

export const Navbar: React.FC<NavbarProps> = ({
  children,
  variant = "server",
}) => {
  return (
    <div className="sidebar">
      <NavbarHeader variant={variant === "server" ? "server" : "dms"} />
      <NavbarVoice />
      <NavbarProfile />
    </div>
  );
};
