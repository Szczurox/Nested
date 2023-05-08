import React, { useEffect, useRef, useState } from "react";
import styles from "../../../styles/components/chat/popups/CreateChannelPopUp.module.scss";
import ScreenPopUp from "./ScreenPopUp";
import { useChannel } from "../../../context/channelContext";
import { TextareaAutosize } from "@material-ui/core";
import PopUpButton, { buttonColors } from "./PopUpButton";

const CreateChannelPopUp: React.FC<{
  onConfirm: (channelName: string) => void;
  onCancel: () => void;
  categoryName: string;
}> = ({ onConfirm, onCancel, categoryName }) => {
  const [channelName, setChannelName] = useState<string>("");

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const { channel } = useChannel();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName != "TEXTAREA" && textAreaRef.current)
        textAreaRef.current!.focus();
    };

    document.addEventListener("keydown", handler, false);
    return () => {
      document.removeEventListener("keydown", handler, false);
    };
  }, []);

  const pasted = (e: ClipboardEvent) => {
    if (e.clipboardData!.files[0] == undefined && channel.id != "") {
      if ((channelName + e.clipboardData!.getData("Text")).length <= 40)
        setChannelName(channelName + e.clipboardData!.getData("Text"));
      else
        setChannelName(
          (channelName + e.clipboardData!.getData("Text")).substring(0, 40)
        );
    }
  };

  useEffect(() => {
    document.addEventListener("paste", pasted);
    return () => {
      document.removeEventListener("paste", pasted);
    };
  }, [channelName]);

  const createChannelKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key == "Enter") {
      e.preventDefault();
      onConfirm(channelName);
    }
  };

  return (
    <ScreenPopUp>
      <div>
        <div className={styles.popup_text}>
          <h3>Create Channel</h3>
          <p>Create channel in {categoryName}</p>
        </div>
        <div className={styles.popup_input}>
          <span className={styles.hash}>#</span>
          <form>
            <TextareaAutosize
              value={channelName}
              wrap="off"
              maxRows={1}
              maxLength={100}
              onChange={(e) => setChannelName(e.target.value)}
              onKeyDown={(e) => createChannelKey(e)}
              placeholder={`new-channel`}
              ref={textAreaRef}
              onFocus={(e) =>
                e.target.setSelectionRange(
                  e.target.value.length,
                  e.target.value.length
                )
              }
              autoFocus
            />
          </form>
        </div>
        <div className={styles.popup_buttons}>
          <div
            className={styles.popup_cancel}
            onClick={(_) => {
              setChannelName("");
              onCancel();
            }}
          >
            Cancel
          </div>
          <PopUpButton
            onClick={(_) => onConfirm(channelName)}
            color={buttonColors.get("grey")!}
          >
            Create
          </PopUpButton>
        </div>
      </div>
    </ScreenPopUp>
  );
};

export default CreateChannelPopUp;
