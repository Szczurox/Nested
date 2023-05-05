import React, { ReactNode, useEffect, useRef, useState } from "react";
import { Avatar, TextareaAutosize } from "@material-ui/core";
import styles from "../../styles/components/chat/Message.module.scss";
import contextMenuStyles from "../../styles/components/chat/contextmenu/ContextMenu.module.scss";
import moment from "moment";
import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  updateDoc,
} from "firebase/firestore";
import { createFirebaseApp } from "../../firebase/clientApp";
import ContextMenu from "./contextmenu/ContextMenu";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useChannel } from "context/channelContext";
import { useUser } from "context/userContext";

interface MessageProps {
  id: string;
  content: string;
  userid: string;
  file?: string;
  time?: string;
  edited?: boolean;
  children?: ReactNode;
  onImageLoad?: () => void;
}

export interface MessageData {
  id: string; // Message id
  content: string;
  timestamp: string;
  uid: string; // Id of user that sent the message
  file?: string;
  edited?: boolean;
}

type ContextMenuHandle = React.ElementRef<typeof ContextMenu>;

export const Message: React.FC<MessageProps> = ({
  id,
  content,
  time,
  file,
  userid = "uid",
  children,
  onImageLoad,
  edited,
}) => {
  const [username, setUsername] = useState<string>("");
  const [avatar, setAvatar] = useState<string>(
    "https://www.pngall.com/wp-content/uploads/5/User-Profile-PNG-High-Quality-Image.png"
  );
  const [input, setInput] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const { channel } = useChannel();
  const { user } = useUser();

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  const menuRef = useRef<ContextMenuHandle>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const messageDoc = doc(
    db,
    "groups",
    "H8cO2zBjCyJYsmM4g5fv",
    "categories",
    channel.idC,
    "channels",
    channel.id,
    "messages",
    id
  );

  useEffect(() => {
    async function getUserData() {
      const docSnap = await getDoc(doc(db, "profile", userid));
      if (docSnap.exists()) {
        setUsername(docSnap.data().username);
        if (docSnap.data().avatar) setAvatar(docSnap.data().avatar);
      }
    }

    document.addEventListener("keydown", handleClick);
    document.addEventListener("click", handleClick);
    document.addEventListener("contextmenu", handleClick);
    getUserData();

    return () => {
      document.removeEventListener("keydown", handleClick);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("contextmenu", handleClick);
    };
  });

  const handleClick = (e: Event): void => {
    if (
      e.type == "click" ||
      (e.type == "contextmenu" &&
        !elementRef.current?.contains(e.target as Node)) ||
      (e.type == "keydown" && (e as KeyboardEvent).key == "Escape")
    )
      menuRef.current?.closeMenu();
    if (
      isEditing &&
      e.type == "keydown" &&
      (e as KeyboardEvent).key == "Escape"
    )
      setIsEditing(false);
  };

  const deleteMessage = async () => {
    await deleteDoc(messageDoc);
    console.log("Deleted: " + id);
  };

  const editBegin = () => {
    setIsEditing(true);
    setInput(content);
  };

  const updateMessage = async () => {
    setIsEditing(false);
    await updateDoc(messageDoc, {
      content: input,
      edited: true,
    });
  };

  const editMessage = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key == "Enter" && e.shiftKey == false && channel.id != "") {
      // Send Message
      setIsEditing(false);
      e.preventDefault();
      if (input.replace(/\s/g, "").length) updateMessage();
      else {
        deleteMessage();
      }
    }
  };

  return username ? (
    <>
      <ContextMenu ref={menuRef}>
        {userid == user.uid && (
          <>
            <li
              className={contextMenuStyles.contextmenu_normal}
              onClick={(_) => editBegin()}
            >
              <EditIcon />
              Edit
            </li>
            <li
              className={contextMenuStyles.contextmenu_delete}
              onClick={(_) => deleteMessage()}
            >
              <DeleteIcon />
              Delete
            </li>
          </>
        )}
        <li
          className={contextMenuStyles.contextmenu_normal}
          onClick={() => navigator.clipboard.writeText(id)}
        >
          <ContentCopyIcon />
          Copy Message ID
        </li>
      </ContextMenu>
      <div
        className={styles.message}
        id={id}
        onContextMenu={(e) =>
          !isEditing && menuRef.current?.handleContextMenu(e)
        }
        ref={elementRef}
      >
        <div className={styles.message_info}>
          <div className={styles.message_profilePicture}>
            <Avatar style={{ height: "45px", width: "45px" }} src={avatar} />
          </div>
          <h4>
            {username}
            <span className={styles.message_timestamp}>
              {moment(time).local().format("MMMM Do YYYY [at] hh:mm a")}
            </span>
          </h4>
          {!isEditing ? (
            content && (
              <div className={styles.message_content}>
                <p>{content}</p>
              </div>
            )
          ) : (
            <div>
              <div className={styles.message_edit_input}>
                <form>
                  <TextareaAutosize
                    value={input}
                    wrap="soft"
                    maxLength={2000}
                    maxRows={10}
                    disabled={channel.id == ""}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={editMessage}
                    placeholder={`Message #${channel.name}`}
                    ref={textAreaRef}
                  />
                  <button
                    disabled={channel.id == ""}
                    className={styles.message_edit_input_button}
                    type="submit"
                  >
                    Send Message
                  </button>
                </form>
              </div>
              <p>
                Press Escape to{" "}
                <a
                  className={styles.message_edit_text_event}
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </a>{" "}
                / Press Enter to{" "}
                <a
                  className={styles.message_edit_text_event}
                  onClick={() => updateMessage()}
                >
                  Save
                </a>
              </p>
            </div>
          )}
          {file && (
            <div className={styles.message_embed}>
              <a href={file} target="_blank" rel="noreferrer">
                <img
                  className={
                    content != "" || isEditing
                      ? styles.message_image_text
                      : styles.message_image
                  }
                  src={file}
                  alt="image"
                  onLoad={(_) => (onImageLoad ? onImageLoad() : null)}
                />
              </a>
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  ) : (
    <div></div>
  );
};

export default Message;
