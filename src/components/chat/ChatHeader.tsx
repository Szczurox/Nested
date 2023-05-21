import React from "react";
import NotificationsIcon from "@material-ui/icons/Notifications";
import EditLocationRoundedIcon from "@material-ui/icons/EditLocationRounded";
import PeopleAltRoundedIcon from "@material-ui/icons/PeopleAltRounded";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import MarkunreadMailboxRoundedIcon from "@material-ui/icons/MarkunreadMailboxRounded";
import HelpRoundedIcon from "@material-ui/icons/HelpRounded";
import styles from "../../styles/components/chat/ChatHeader.module.scss";
import { useChannel } from "context/channelContext";

interface ChatHeaderProps {
  onMembers: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onMembers }) => {
  const { channel } = useChannel();

  return (
    <div className={styles.shadow}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeader_left}>
          <h3>
            <span className={styles.chatHeader_hash}>#</span>
            {channel.name}
          </h3>
        </div>
        <div className={styles.chatHeader_right}>
          <NotificationsIcon />
          <EditLocationRoundedIcon />
          <PeopleAltRoundedIcon onClick={(_) => onMembers()} />

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
