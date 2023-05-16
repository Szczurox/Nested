import React, { ReactNode, useEffect, useRef, useState } from "react";
import { Avatar, TextareaAutosize } from "@material-ui/core";
import styles from "../../styles/components/chat/Message.module.scss";
import moment from "moment";
import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  updateDoc,
} from "firebase/firestore";
import { createFirebaseApp } from "../../firebase/clientApp";
import ContextMenu, { ContextMenuHandle } from "./contextmenu/ContextMenu";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import LinkIcon from "@material-ui/icons/Link";
import { useChannel } from "context/channelContext";
import { useUser } from "context/userContext";
import { useMessage } from "context/messageContext";
import DeleteConfirmPopUp from "./popup/DeleteConfirmPopUp";
import ContextMenuElement from "./contextmenu/ContextMenuElement";
import { MediaType } from "./UploadFile";

interface MessageProps {
  id: string;
  content: string;
  userid: string;
  file?: string;
  fileType?: MediaType;
  time?: number;
  edited?: boolean;
  children?: ReactNode;
  onImageLoad?: () => void;
}

export interface MessageData {
  id: string; // Message id
  content: string;
  timestamp: number;
  uid: string; // Id of user that sent the message
  file?: string;
  fileType?: MediaType;
  edited?: boolean;
}

type ContentType = "text" | "link";

export const Message: React.FC<MessageProps> = ({
  id,
  content,
  time,
  file,
  fileType,
  userid = "uid",
  children,
  onImageLoad,
  edited,
}) => {
  const [nickname, setNickname] = useState<string>("");
  const [nickColor, setNickColor] = useState<string>("white");
  const [avatar, setAvatar] = useState<string>(
    "https://www.pngall.com/wp-content/uploads/5/User-Profile-PNG-High-Quality-Image.png"
  );
  const [realTime, setRealTime] = useState<string>(""); // Time after formatting
  const [input, setInput] = useState<string>(""); // Message edit input
  const [currentLink, setCurrentLink] = useState<string>(""); // Link to embed / link user used contextmenu on
  const [isEditing, setIsEditing] = useState<boolean>(false); // Is message currently being edited
  const [showPopUp, setShowPopUp] = useState<boolean>(false); // Delete confirmation pop-up
  const [menuOnLink, setMenuOnLink] = useState<boolean>(false); // Is content menu opened on link / embed
  // Content after getting divided into links and non-links
  const [parsedContent, setParsedContent] = useState<[string, ContentType][]>(
    []
  );
  // Files from message content links
  const [filesFromLinks, setFilesFromLinks] = useState<[string, MediaType][]>(
    []
  );
  // Iframes from message content links
  const [iframes, setIframes] = useState<string[]>([]);

  const { channel } = useChannel();
  const { user } = useUser();
  const { message, setCurrentMessage } = useMessage();

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  const menuRef = useRef<ContextMenuHandle>(null);
  const userMenuRef = useRef<ContextMenuHandle>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLImageElement>(null);

  const allowedIFrames: string[] = [
    "https://youtube.com",
    "https://www.youtube.com",
    "https://youtu.be",
    "https://www.youtu.be",
  ];

  const messageDoc = doc(
    db,
    "groups",
    channel.idG,
    "channels",
    channel.id,
    "messages",
    id
  );

  useEffect(() => {
    async function getUserData() {
      if (channel.idG != "") {
        // Try to get user's member object
        const docMemberSnap = await getDoc(
          doc(db, "groups", channel.idG, "members", userid)
        );
        if (docMemberSnap.exists()) {
          // If it exists set all message data accordingly
          setNickname(docMemberSnap.data().nickname);
          if (docMemberSnap.data().nameColor)
            setNickColor(docMemberSnap.data().nameColor);
          if (docMemberSnap.data().avatar)
            setAvatar(docMemberSnap.data().avatar);
        } else {
          // If it doesn't exist get author info from users
          const docSnap = await getDoc(doc(db, "profile", userid));
          if (docSnap.exists()) {
            setNickname(docSnap.data().username);
            if (docSnap.data().avatar) setAvatar(docSnap.data().avatar);
          }
        }
      }
    }

    function setTime() {
      // Day the message was sent
      const messageDay = moment(time).local().format("Do");

      // Set the formatted date to Today/Yesterday if the message was sent on the according day
      // Otherwise set it to
      if (moment().local().format("Do") == messageDay)
        setRealTime(moment(time).local().format("[Today] [at] hh:mm a"));
      else if (moment().local().subtract(1, "days").format("Do") == messageDay)
        setRealTime(moment(time).local().format("[Yesterday] [at] hh:mm a"));
      else
        setRealTime(moment(time).local().format("MMMM Do YYYY [at] hh:mm a"));
    }

    function checkForLinks() {
      // Check if there are any links in the content
      if (content.includes("https://") || content.includes("http://")) {
        // Split content into links and non-links
        content.split(/([http|https]+:\/\/[\w\S(\.|:|/)]+)/g).forEach((el) => {
          // If element is link
          if (el.startsWith("https://") || el.startsWith("http://")) {
            // Remove all metadata from possible image/vide
            const parsedLink = el.substring(0, el.indexOf("?"));

            // If image then add as image, if video then add as video to files
            if (/\.(jpg|jpeg|png|webp|avif|gif)$/.test(parsedLink)) {
              setFilesFromLinks((files) => [...files, [el, "image"]]);
            } else if (/\.(mp4|mov|avi|mkv|flv)$/.test(parsedLink)) {
              setFilesFromLinks((files) => [...files, [el, "video"]]);
            }

            // Check if is a link to one of the supported iframes (only YouTube for now)
            else if (
              allowedIFrames.some((element) => el.startsWith(element)) &&
              !iframes.includes(el)
            ) {
              // Parse youtube URL so that it links to embed
              const elParsed = el
                .replace("youtu.be/", "www.youtube.com/embed/")
                .replace("watch?v=", "embed/");

              // Remove unnecessary link data such as playlist ID and add to iframes
              setIframes((iframes) => [
                ...iframes.filter((element) => element != el),
                elParsed.slice(
                  0,
                  el.includes("&") ? el.indexOf("&") - 2 : elParsed.length
                ),
              ]);
            }

            // Add as link
            setParsedContent((parsedContent) => [
              ...parsedContent!,
              [el, "link"],
            ]);
          }
          // Add as text
          else
            setParsedContent((parsedContent) => [
              ...parsedContent!,
              [el, "text"],
            ]);
        });
      } else setParsedContent([[content, "text"]]);
    }

    getUserData();
    setTime();
    checkForLinks();

    document.addEventListener("keydown", handleClick);
    document.addEventListener("contextmenu", handleClick);

    return () => {
      document.removeEventListener("keydown", handleClick);
      document.removeEventListener("contextmenu", handleClick);
    };
  }, []);

  useEffect(() => {
    // If another message is getting edited stop editing this message
    if (message.id != id) setIsEditing(false);
  }, [message.id]);

  const handleClick = (e: Event): void => {
    // Close message content menu if contextmenu used on avatar
    if (avatarRef.current?.contains(e.target as Node))
      menuRef.current?.closeMenu();

    const type = (e.target! as HTMLElement).tagName;

    // Additional message contextmenu options if used on embed or link
    if (type == "A" || type == "IMG" || type == "VIDEO") {
      setMenuOnLink(true);
      if (type == "A") setCurrentLink((e.target as HTMLLinkElement).href);
      if (type == "IMG")
        setCurrentLink((e.target as HTMLImageElement).currentSrc);
      if (type == "VIDEO")
        setCurrentLink((e.target as HTMLImageElement).currentSrc);
    } else setMenuOnLink(false);

    if (e.type == "keydown" && (e as KeyboardEvent).key == "Escape")
      setIsEditing(false);
  };

  const deleteMessage = async () => {
    setShowPopUp(false);
    await deleteDoc(messageDoc);
    console.log("Deleted: " + id);
  };

  const deleteBegin = (e: any) => {
    if (e.shiftKey == true) {
      deleteMessage();
    } else {
      setShowPopUp(true);
    }
  };

  const editBegin = () => {
    setIsEditing(true);
    setInput(content);
    setCurrentMessage(id);
  };

  const updateMessage = async () => {
    setIsEditing(false);
    await updateDoc(messageDoc, {
      content: input,
      edited: true,
    });
  };

  const editMessage = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key == "Escape") setIsEditing(false);
    if (e.key == "Enter" && e.shiftKey == false) {
      // Edit Message
      setIsEditing(false);
      e.preventDefault();
      if (input != content) {
        if (input.replace(/\s/g, "").length) updateMessage();
        else {
          // Ask if user wants to delete the message if input is set to empty
          setShowPopUp(true);
        }
      }
    }
  };

  const messageContent = (
    <div className={styles.message_content}>
      <p>
        {parsedContent.map((el) =>
          el[1] == "text" ? (
            <span>{el[0]}</span>
          ) : (
            <a href={el[0]} target="_blank" rel="noreferrer">
              {el[0]}
            </a>
          )
        )}
        {edited && (
          <span className={styles.message_edited_indicator}>{" (edited)"}</span>
        )}
      </p>
    </div>
  );

  const fileContent = (inPopUp: boolean) => {
    return (
      <>
        {file ? (
          <div className={styles.message_embed}>
            {fileType == "image" ? (
              <a href={file} target="_blank" rel="noreferrer">
                <img
                  className={
                    inPopUp
                      ? styles.message_delete_embed
                      : content != "" || isEditing
                      ? styles.message_embed_text
                      : styles.message_embed
                  }
                  src={file}
                  alt="image"
                  onLoad={(_) =>
                    !inPopUp && onImageLoad ? onImageLoad() : null
                  }
                />
              </a>
            ) : (
              <video
                className={
                  inPopUp
                    ? styles.message_delete_embed
                    : content != "" || isEditing
                    ? styles.message_embed_text
                    : styles.message_embed
                }
                controls
              >
                <source
                  src={file}
                  onLoad={(_) =>
                    !inPopUp && onImageLoad ? onImageLoad() : null
                  }
                />
                Your browser does not support the video files, {file}.
              </video>
            )}
          </div>
        ) : null}
        {/*  Embeds from links  */}
        {!inPopUp ? (
          <>
            {iframes.map((el) => {
              return (
                <iframe
                  src={el}
                  className={styles.message_iframe}
                  onLoad={(_) => (onImageLoad ? onImageLoad() : null)}
                  key={el}
                />
              );
            })}
            {filesFromLinks.map((el) =>
              el[1] == "image" ? (
                <img
                  src={el[0]}
                  className={styles.message_embed_link}
                  key={el[0]}
                ></img>
              ) : (
                <video
                  className={styles.message_embed_link}
                  controls
                  key={el[0]}
                >
                  <source
                    src={el[0]}
                    onLoad={(_) => (onImageLoad ? onImageLoad() : null)}
                  />
                </video>
              )
            )}
          </>
        ) : null}
      </>
    );
  };

  const senderInfo = (
    <>
      <div
        className={styles.message_profilePicture}
        onContextMenu={(e) =>
          !isEditing && userMenuRef.current?.handleContextMenu(e)
        }
      >
        <Avatar
          style={{ height: "45px", width: "45px" }}
          src={avatar}
          innerRef={avatarRef}
          onLoad={(_) =>
            !isEditing ? (onImageLoad ? onImageLoad!() : null) : null
          }
        />
      </div>
      <h4 style={{ color: nickColor }}>
        {nickname}
        <span className={styles.message_timestamp}>{realTime}</span>
      </h4>
    </>
  );

  return nickname ? (
    <>
      <ContextMenu ref={menuRef} parentRef={elementRef}>
        {userid == user.uid && (
          <>
            <ContextMenuElement onClick={(_) => editBegin()}>
              <EditIcon />
              Edit
            </ContextMenuElement>
          </>
        )}
        {(userid == user.uid ||
          user.permissions.includes("MODERATE_MESSAGES")) && (
          <ContextMenuElement type="red" onClick={deleteBegin}>
            <DeleteIcon />
            Delete
          </ContextMenuElement>
        )}
        {menuOnLink && (
          <>
            <ContextMenuElement
              onClick={() => navigator.clipboard.writeText(currentLink)}
            >
              <LinkIcon />
              Copy Link
            </ContextMenuElement>
            <ContextMenuElement
              onClick={() => window!.open(currentLink, "_blank")!.focus()}
            >
              <OpenInNewIcon />
              Open Link
            </ContextMenuElement>
          </>
        )}
        <ContextMenuElement onClick={() => navigator.clipboard.writeText(id)}>
          <ContentCopyIcon />
          Copy Message ID
        </ContextMenuElement>
      </ContextMenu>
      <ContextMenu ref={userMenuRef} parentRef={avatarRef}>
        <ContextMenuElement
          onClick={(_) => navigator.clipboard.writeText(userid)}
        >
          <ContentCopyIcon />
          Copy User ID
        </ContextMenuElement>
      </ContextMenu>
      {showPopUp ? (
        <DeleteConfirmPopUp
          onConfirm={() => (showPopUp ? deleteMessage() : null)}
          onCancel={() => setShowPopUp(false)}
        >
          <div className={styles.message_info}>
            {senderInfo}
            {content && messageContent}
            {fileContent(true)}
          </div>
        </DeleteConfirmPopUp>
      ) : null}
      <div
        className={styles.message}
        id={id}
        onContextMenu={(e) =>
          !isEditing && menuRef.current?.handleContextMenu(e)
        }
        ref={elementRef}
      >
        <div className={styles.message_info}>
          {senderInfo}
          {!isEditing ? (
            content && messageContent
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
                    onFocus={(e) =>
                      e.target.setSelectionRange(
                        e.target.value.length,
                        e.target.value.length
                      )
                    }
                    autoFocus
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
          {fileContent(false)}
          {children}
        </div>
      </div>
    </>
  ) : (
    <div></div>
  );
};

export default Message;
