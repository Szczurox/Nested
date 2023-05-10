import React, { useEffect, useRef, useState } from "react";
import styles from "../../../styles/components/chat/popups/UploadFilePopUp.module.scss";
import ScreenPopUp from "./ScreenPopUp";
import { useChannel } from "../../../context/channelContext";
import { TextareaAutosize } from "@material-ui/core";
import PopUpButton, { buttonColors } from "./PopUpButton";
import { MediaType } from "../UploadFile";

interface UploadFilePopUpProps {
  fileUrl: string;
  chatInput: string;
  type: MediaType;
  uploadFile: (input: string) => void;
  cancelled: () => void;
}

const UploadFilePopUp: React.FC<UploadFilePopUpProps> = ({
  uploadFile,
  cancelled,
  fileUrl,
  chatInput,
  type,
}) => {
  const [input, setInput] = useState<string>(chatInput);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const { channel } = useChannel();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName != "TEXTAREA" &&
        textAreaRef.current &&
        !e.ctrlKey
      )
        textAreaRef.current!.focus();
      if (e.key == "Enter") uploadFile(input);
    };

    document.addEventListener("keydown", handler, false);
    return () => {
      document.removeEventListener("keydown", handler, false);
    };
  }, []);

  const pasted = (e: ClipboardEvent) => {
    if (e.clipboardData!.files[0] == undefined && channel.id != "") {
      if ((input + e.clipboardData!.getData("Text")).length <= 2000)
        setInput(input + e.clipboardData!.getData("Text"));
      else
        setInput((input + e.clipboardData!.getData("Text")).substring(0, 2000));
    }
  };

  useEffect(() => {
    document.addEventListener("paste", pasted);
    return () => {
      document.removeEventListener("paste", pasted);
    };
  }, [input]);

  const uploadFileKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key == "Enter" && e.shiftKey == false && channel.id != "") {
      e.preventDefault();
      uploadFile(input);
    }
  };

  return (
    <ScreenPopUp>
      <div>
        {type === "image" ? (
          <img
            className={styles.upload_file_media}
            src={fileUrl}
            alt="Image couldn't load"
          />
        ) : (
          <video className={styles.upload_file_media} controls>
            <source src={fileUrl} />
            Your browser does not support the video files, {fileUrl}.
          </video>
        )}
        <p>
          Upload to <b>#{channel.name}</b>
        </p>
        <div className={styles.popup_input}>
          <form>
            <TextareaAutosize
              value={input}
              maxRows={10}
              wrap="soft"
              maxLength={2000}
              disabled={channel.id == ""}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => uploadFileKey(e)}
              placeholder={`Message #${channel.name}`}
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
              setInput("");
              cancelled();
            }}
          >
            Cancel
          </div>
          <PopUpButton
            onClick={(_) => uploadFile(input)}
            color={buttonColors.get("red")!}
          >
            Upload
          </PopUpButton>
        </div>
      </div>
    </ScreenPopUp>
  );
};

export default UploadFilePopUp;
