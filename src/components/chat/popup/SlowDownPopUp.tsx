import React from "react";
import styles from "../../../styles/components/chat/popups/SlowDownPopUp.module.scss";
import ScreenPopUp from "./ScreenPopUp";

const SlowDownPopUp: React.FC<{ onOk: () => void }> = ({ onOk }) => {
  return (
    <ScreenPopUp>
      <div className={styles.popup_text}>
        <h3>Slow down!</h3>
        <div>You are trying to send messages too quickly.</div>
      </div>
      <div className={styles.popup_buttons}>
        <button className={styles.popup_ok} onClick={() => onOk()}>
          OK
        </button>
      </div>
    </ScreenPopUp>
  );
};

export default SlowDownPopUp;
