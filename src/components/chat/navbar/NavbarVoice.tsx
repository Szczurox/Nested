import React from "react";
import SignalCelluralAltIcon from "@material-ui/icons/SignalCellularAlt";
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import CallIcon from "@material-ui/icons/Call";
import styles from "../../../styles/components/chat/navbar/NavbarVoice.module.scss";

export const NavbarVoice: React.FC = ({}) => {
  return (
    <div className={styles.voice}>
      <SignalCelluralAltIcon
        className={styles.connection_icon}
        fontSize="large"
      />
      <div className={styles.info}>
        <h3>Voice Connected</h3>
        <p>Voice Channel</p>
      </div>
      <div className={styles.icons}>
        <InfoOutlinedIcon className={styles.icon} />
        <CallIcon className={styles.icon} />
      </div>
    </div>
  );
};
