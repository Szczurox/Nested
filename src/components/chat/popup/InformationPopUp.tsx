import React, { ReactNode, useEffect } from "react";
import styles from "../../../styles/components/chat/popups/InformationPopUp.module.scss";
import ScreenPopUp from "./ScreenPopUp";
import PopUpButton from "./PopUpButton";

interface InformationPopUpProps {
  onOk: () => void;
  children: ReactNode;
}

const InformationPopUp: React.FC<InformationPopUpProps> = ({
  onOk,
  children,
}) => {
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (e.key == "Enter") onOk();
    };

    document.addEventListener("keydown", handler, false);
    return () => {
      document.removeEventListener("keydown", handler, false);
    };
  }, []);

  return (
    <ScreenPopUp>
      <div className={styles.popup_text}>{children}</div>
      <div className={styles.popup_buttons}>
        <PopUpButton color="grey" onClick={(_) => onOk()}>
          OK
        </PopUpButton>
      </div>
    </ScreenPopUp>
  );
};

export default InformationPopUp;
