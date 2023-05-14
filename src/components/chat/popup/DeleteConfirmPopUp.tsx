import React, { ReactNode, useEffect } from "react";
import styles from "../../../styles/components/chat/popups/DeleteConfirmPopUp.module.scss";
import ScreenPopUp from "./ScreenPopUp";
import PopUpButton, { buttonColors } from "./PopUpButton";

export interface DeleteConfirmPopUpProps {
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

const DeleteConfirmPopUp: React.FC<DeleteConfirmPopUpProps> = ({
  onConfirm,
  onCancel,
  children,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key == "Enter") onConfirm();
    };

    document.addEventListener("keydown", handler, false);
    return () => {
      document.removeEventListener("keydown", handler, false);
    };
  }, []);

  return (
    <ScreenPopUp>
      <div className={styles.popup_text}>
        <h3>Delete Message</h3>
        <p>Are you sure u want to delete this message?</p>
      </div>
      <div className={styles.message_preview}>{children}</div>
      <div className={styles.popup_buttons}>
        <div className={styles.popup_cancel} onClick={(_) => onCancel()}>
          Cancel
        </div>
        <PopUpButton onClick={(_) => onConfirm()} color={"red"}>
          Delete
        </PopUpButton>
      </div>
    </ScreenPopUp>
  );
};

export default DeleteConfirmPopUp;
