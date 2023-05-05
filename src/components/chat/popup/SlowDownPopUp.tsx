import React, { useEffect } from "react";
import styles from "../../../styles/components/chat/popups/SlowDownPopUp.module.scss";
import ScreenPopUp from "./ScreenPopUp";
import PopUpButton from "./PopUpButton";

const SlowDownPopUp: React.FC<{ onOk: () => void }> = ({ onOk }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key == "Enter") onOk();
    };

    document.addEventListener("keydown", handler, false);
    return () => {
      document.removeEventListener("keydown", handler, false);
    };
  }, []);

  return (
    <ScreenPopUp>
      <div className={styles.popup_text}>
        <h3>Slow down!</h3>
        <p>You are trying to send messages too quickly.</p>
      </div>
      <div className={styles.popup_buttons}>
        <PopUpButton onClick={(_) => onOk()}>OK</PopUpButton>
      </div>
    </ScreenPopUp>
  );
};

export default SlowDownPopUp;
