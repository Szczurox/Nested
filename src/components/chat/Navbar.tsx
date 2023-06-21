import React, { useEffect, useState } from "react";
import { NavbarHeader } from "./navbar/NavbarHeader";
import { NavbarVoice } from "./navbar/NavbarVoice";
import { NavbarProfile } from "./navbar/NavbarProfile";
import styles from "../../styles/components/chat/Navbar.module.scss";
import { NavbarCategories } from "./navbar/NavbarCategories";
import { useMediaQuery } from "@material-ui/core";
import { useChannel } from "context/channelContext";

export type NavbarVariant = "server" | "dms";

interface NavbarProps {
  variant?: NavbarVariant;
  hideNavbar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  variant = "server",
  hideNavbar,
}) => {
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);

  const { channel } = useChannel();

  useEffect(() => {
    setIsVoiceConnected(channel.voiceId != "");
  }, [channel.voiceId]);

  return (
    <div className={styles.navbar}>
      <NavbarHeader variant={variant === "server" ? "server" : "dms"} />
      <NavbarCategories hideNavbar={hideNavbar} />
      {isVoiceConnected ? <NavbarVoice /> : null}
      <NavbarProfile />
    </div>
  );
};
