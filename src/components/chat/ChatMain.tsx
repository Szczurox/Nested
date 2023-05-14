import { TextareaAutosize } from "@material-ui/core";
import { ProgressBar } from "react-bootstrap";
import React, { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import Message, { MessageData } from "./Message";
import UploadFile, { FileUploadingData } from "./UploadFile";
import styles from "../../styles/Chat.module.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import GifIcon from "@material-ui/icons/Gif";
import { createFirebaseApp } from "../../firebase/clientApp";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import moment from "moment";
import { serverTimestamp } from "firebase/firestore";
import { useChannel } from "context/channelContext";
import { useUser } from "context/userContext";
import { useMessage } from "context/messageContext";
import { usePopUp } from "context/popUpContext";
import Emoji from "./ui-icons/Emoji";
import InformationPopUp from "./popup/InformationPopUp";
import { wait } from "components/utils/utils";

export const ChatMain: React.FC = ({}) => {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [filesUploading, setFilesUploading] = useState<FileUploadingData[]>([]);
  const [lastKey, setLastKey] = useState<Timestamp>(new Timestamp(0, 0));
  const [unsubs, setUnsubs] = useState<(() => void)[]>([]);
  const [slowDownCount, setSlowDownCount] = useState<number>(0);
  const [messagesEnd, setMessagesEnd] = useState<boolean>(false);
  const [canScrollToBottom, setCanScrollToBottom] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const listInnerRef = useRef<HTMLHeadingElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const { channel } = useChannel();
  const { user } = useUser();
  const { message } = useMessage();
  const { popUp } = usePopUp();

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  const messagesCollection = collection(
    db,
    "groups",
    channel.idG,
    "channels",
    channel.id ? channel.id : "None",
    "messages"
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [popUp.isOpen]);

  useEffect(() => {
    document.addEventListener("paste", pasted);
    return () => {
      document.removeEventListener("paste", pasted);
    };
  }, [input, popUp.isOpen]);

  useEffect(() => {
    const { scrollTop, scrollHeight, clientHeight } = listInnerRef.current!;
    if (scrollTop >= scrollHeight - clientHeight - 60) scrollToBottom();
  }, [message]);

  const pasted = (e: ClipboardEvent) => {
    if (
      e.clipboardData!.files[0] == undefined &&
      channel.id != "" &&
      !popUp.isOpen &&
      document.activeElement?.tagName != "TEXTAREA"
    ) {
      if ((input + e.clipboardData!.getData("Text")).length <= 2000)
        setInput(input + e.clipboardData!.getData("Text"));
      else
        setInput((input + e.clipboardData!.getData("Text")).substring(0, 2000));
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (
      document.activeElement?.tagName != "TEXTAREA" &&
      !popUp.isOpen &&
      textAreaRef.current &&
      ((e.ctrlKey && e.code == "KeyA") || !e.ctrlKey)
    )
      textAreaRef.current.focus();
  };

  const handleScroll = (_: any) => {
    const { scrollTop, scrollHeight, clientHeight } = listInnerRef.current!;
    setAutoScroll(scrollTop >= scrollHeight - clientHeight - 100);

    if (listInnerRef.current) {
      const { scrollTop, scrollHeight } = listInnerRef.current;
      if (scrollTop < scrollHeight / 4 && !messagesEnd) {
        listInnerRef.current.scrollTop += scrollHeight / 4;
        const unsub = getMessages();
        setUnsubs([...unsubs, unsub]);
      }
      if (scrollTop < scrollHeight / 1.9 && messages.length > 60) {
        setCanScrollToBottom(true);
      } else {
        setCanScrollToBottom(false);
      }
    }
  };

  const scrollToBottom = () => {
    if (listInnerRef.current != null) {
      listInnerRef.current.scrollTop =
        listInnerRef.current.scrollHeight - listInnerRef.current.clientHeight;
    }
  };

  function callback(qMes: any) {
    return onSnapshot(qMes, (querySnapshot: any) => {
      querySnapshot.docChanges().forEach((change: any) => {
        if (change.type === "added" || change.type === "modified") {
          setMessages((messages) =>
            [
              {
                id: change.doc.id,
                content: change.doc.data().content,
                timestamp: change.doc.data().time,
                uid: change.doc.data().userid,
                file: change.doc.data().file,
                edited: change.doc.data().edited,
                fileType: change.doc.data().fileType,
              },
              ...messages.filter((el) => el.id !== change.doc.id),
            ].sort((x, y) => {
              return new Date(x.timestamp) > new Date(y.timestamp) ? 1 : -1;
            })
          );
        }
        if (change.type === "removed") {
          setMessages((messages) =>
            [...messages.filter((el) => el.id !== change.doc.id)].sort(
              (x, y) => {
                return new Date(x.timestamp) > new Date(y.timestamp) ? 1 : -1;
              }
            )
          );
        }
      });
      if (querySnapshot.docs.length > 0) {
        setLastKey(
          querySnapshot.docs[querySnapshot.docs.length - 1].data().createdAt
        );
        setMessagesEnd(false);
      } else setMessagesEnd(true);
    });
  }

  function getMessages() {
    // Channels query
    const qMes = query(
      messagesCollection,
      orderBy("createdAt", "desc"),
      limit(20),
      startAfter(lastKey)
    );

    return callback(qMes);
  }

  const onImageLoadComplete = () => {
    if (listInnerRef.current && autoScroll) {
      listInnerRef.current.focus();
      scrollToBottom();
    }
  };

  useEffect(() => {
    function getMessagesFirstBatch() {
      // Channels query
      const qMes = query(
        messagesCollection,
        orderBy("createdAt", "desc"),
        limit(20)
      );

      const unsub = onSnapshot(qMes, (querySnapshot) => {
        querySnapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            if (!messages.map((el) => el.id).includes(change.doc.id)) {
              setMessages((messages) =>
                [
                  ...messages.filter((el) => el.id !== change.doc.id),
                  {
                    id: change.doc.id,
                    content: change.doc.data().content,
                    timestamp: change.doc.data().time,
                    uid: change.doc.data().userid,
                    file: change.doc.data().file,
                    edited: change.doc.data().edited,
                    fileType: change.doc.data().fileType,
                  },
                ].sort((x, y) => {
                  return new Date(x.timestamp) > new Date(y.timestamp) ? 1 : -1;
                })
              );
            }
          }
          if (change.type === "removed") {
            setMessages((messages) =>
              [...messages.filter((el) => el.id !== change.doc.id)].sort(
                (x, y) => {
                  return new Date(x.timestamp) > new Date(y.timestamp) ? 1 : -1;
                }
              )
            );
          }
        });

        if (querySnapshot.docs.length > 0) {
          setLastKey(
            querySnapshot.docs[querySnapshot.docs.length - 1].data().createdAt
          );
          setMessagesEnd(false);
        } else setMessagesEnd(true);
      });

      return unsub;
    }

    setMessages([]);
    textAreaRef.current!.focus();
    setAutoScroll(true);
    const unsub = getMessagesFirstBatch();
    return () => {
      if (unsubs.length > 0)
        for (let i = 0; i < unsubs.length; i++) unsubs[i]();
      unsub();
    };
  }, [channel.id]);

  async function sendMessage(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (slowDownCount > 1 || popUp.isOpen) {
      // Don't update input if sending messages too quickly or pop-up is open
      e.preventDefault();
      textAreaRef.current!.blur();
    } else if (e.key == "Enter" && e.shiftKey == false && channel.id != "") {
      const timestamp = serverTimestamp();
      const chatInput = input;
      setInput("");
      // Send Message
      e.preventDefault();
      if (chatInput.replace(/\s/g, "").length) {
        await addDoc(messagesCollection, {
          time: moment().utcOffset("+00:00").format(),
          content: chatInput,
          userid: user.uid,
          createdAt: timestamp,
          edited: false,
        }).catch((_) => {
          setSlowDownCount(slowDownCount + 1);
        });

        await updateDoc(doc(db, "profile", user.uid), {
          lastMessagedAt: timestamp,
        }).catch((err) => {
          console.log(err);
        });
      }
    }
  }

  const fileUploading = (fileData: FileUploadingData) => {
    if (fileData.percent == 0) setInput("");
    if (fileData.percent != 101)
      setFilesUploading((files) => [
        ...files.filter((el) => el.id != fileData.id),
        fileData,
      ]);
    else
      setFilesUploading((files) => files.filter((el) => el.id != fileData.id));
    if (autoScroll) {
      scrollToBottom();
    }
  };

  return (
    <div className={styles.chat}>
      {slowDownCount > 1 ? (
        <InformationPopUp
          onOk={() => wait(1500).then(() => setSlowDownCount(0))}
        >
          <h3>Slow down!</h3>
          <p>You are trying to send messages too quickly.</p>
        </InformationPopUp>
      ) : null}
      <div className={styles.chat_shadow}>
        <ChatHeader />
      </div>
      <div
        className={styles.chat_messages}
        onScroll={(e) => handleScroll(e)}
        ref={listInnerRef}
      >
        {messages.map(
          ({ id, content, timestamp, uid, file, edited, fileType }) => (
            <Message
              key={id}
              id={id}
              content={content}
              time={timestamp}
              userid={uid}
              file={file}
              onImageLoad={onImageLoadComplete}
              edited={edited}
              fileType={fileType}
            />
          )
        )}
        {filesUploading.map(({ name, percent, id }) => {
          return (
            <Message
              key={id}
              id={id}
              content={""}
              time={moment().utcOffset("+00:00").format()}
              userid={user.uid}
            >
              <div className={styles.chat_file_uploading}>
                <InsertDriveFileIcon className={styles.chat_upload_icon} />
                <div className={styles.chat_upload_info}>
                  <div className={styles.chat_upload_name}>{name}</div>
                  <ProgressBar
                    now={percent}
                    className={styles.chat_upload_progressbar}
                  />
                </div>
              </div>
            </Message>
          );
        })}
        <div></div>
      </div>
      <div className={styles.chat_input}>
        <UploadFile chatInput={input} uploadCallback={fileUploading} />
        <form>
          <TextareaAutosize
            value={input}
            wrap="soft"
            maxLength={2000}
            maxRows={10}
            disabled={channel.id == ""}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={sendMessage}
            placeholder={`Message #${channel.name}`}
            ref={textAreaRef}
          />
          <button
            disabled={channel.id == ""}
            className={styles.chat_input_button}
            type="submit"
          >
            Send Message
          </button>
        </form>
        <div className={styles.chat_input_icons}>
          <GifIcon fontSize="large" />
          <Emoji />
        </div>
      </div>
      {canScrollToBottom && (
        <div
          className={styles.chat_jump}
          onClick={(_) => {
            setCanScrollToBottom(false);
            scrollToBottom();
          }}
        >
          Jump To Present
        </div>
      )}
    </div>
  );
};
