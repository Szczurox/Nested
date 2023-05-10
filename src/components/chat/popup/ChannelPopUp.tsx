import React, { useEffect, useRef, useState } from "react";
import styles from "../../../styles/components/chat/popups/ChannelPopUp.module.scss";
import ScreenPopUp from "./ScreenPopUp";
import { TextareaAutosize } from "@material-ui/core";
import PopUpButton, { buttonColors } from "./PopUpButton";

interface ChannelPopUpProps {
  onConfirm: (channelName: string) => void;
  onCancel: () => void;
  categoryName?: string;
  name?: string;
  type: ChannelType;
}

type ChannelType = "create" | "update";

const ChannelPopUp: React.FC<ChannelPopUpProps> = ({
  onConfirm,
  onCancel,
  categoryName,
  name,
  type,
}) => {
  const [channelName, setChannelName] = useState<string>(
    type == "update" ? name! : ""
  );

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName != "TEXTAREA" &&
        textAreaRef.current &&
        !e.ctrlKey
      )
        textAreaRef.current!.focus();
    };

    document.addEventListener("keydown", handler, false);
    return () => {
      document.removeEventListener("keydown", handler, false);
    };
  }, []);

  const pasted = (e: ClipboardEvent) => {
    if (e.clipboardData!.files[0] == undefined) {
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
          <h3>
            {type === "create" ? "Create Channel" : "Change Channel Name"}
          </h3>
          {type === "create" ? (
            <p>Create channel in {categoryName}</p>
          ) : (
            <p>Change name for #{name}</p>
          )}
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
              placeholder={type === "create" ? `new-channel` : name}
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
            {type == "create" ? "Create" : "Change"}
          </PopUpButton>
        </div>
      </div>
    </ScreenPopUp>
  );
};

export default ChannelPopUp;
