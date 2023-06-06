import React from "react";
import NotificationsIcon from "@material-ui/icons/Notifications";
import EditLocationRoundedIcon from "@material-ui/icons/EditLocationRounded";
import PeopleAltRoundedIcon from "@material-ui/icons/PeopleAltRounded";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import MenuIcon from "@mui/icons-material/Menu";
import MarkunreadMailboxRoundedIcon from "@material-ui/icons/MarkunreadMailboxRounded";
import HelpRoundedIcon from "@material-ui/icons/HelpRounded";
import useMediaQuery from "@mui/material/useMediaQuery";
import styles from "../../styles/components/chat/ChatHeader.module.scss";
import { useChannel } from "context/channelContext";

interface ChatHeaderProps {
  isNavbarOpen: boolean;
  isMembersOpen: boolean;
  onMembers: () => void;
  setShowNavbar: (show: boolean) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  isNavbarOpen,
  isMembersOpen,
  onMembers,
  setShowNavbar,
}) => {
  const { channel } = useChannel();

  const isMobile = useMediaQuery("(max-width:700px)");

  return (
    <div className={styles.shadow}>
      <div
        className={
          isNavbarOpen
            ? `${styles.chatHeader} ${styles.chatHeader_navbar_open}`
            : isMembersOpen
            ? `${styles.chatHeader} ${styles.chatHeader_members_open}`
            : styles.chatHeader
        }
      >
        {isMobile ? (
          <div className={styles.chatHeader_menu_icon}>
            <MenuIcon onClick={(_) => setShowNavbar(!isNavbarOpen)} />
          </div>
        ) : null}
        <div className={styles.chatHeader_left}>
          <h3>
            <span className={styles.chatHeader_hash}>#</span>
            {channel.name}
          </h3>
        </div>
        <div className={styles.chatHeader_right}>
          <NotificationsIcon />
          <EditLocationRoundedIcon />
          <PeopleAltRoundedIcon
            onClick={(_) => onMembers()}
            className={styles.chatHeader_people}
          />

          <div className={styles.chatHeader_search}>
            <input placeholder="Search" />
            <SearchRoundedIcon />
          </div>
          <MarkunreadMailboxRoundedIcon />
          <HelpRoundedIcon />
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
