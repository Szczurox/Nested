import React, { useEffect, useRef, useState } from "react";
import SignalCelluralAltIcon from "@material-ui/icons/SignalCellularAlt";
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
        <h4>Voice Connected</h4>
        <p>Voice Channel</p>
      </div>
      <div className={styles.icons}>
        <CallIcon className={styles.icon} />
      </div>
    </div>
  );
};
