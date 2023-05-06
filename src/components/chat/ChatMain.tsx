import { TextareaAutosize } from "@material-ui/core";
import { ProgressBar } from "react-bootstrap";
import React, { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import Message, { MessageData } from "./Message";
import UploadFile, { FileUploadingData, UploadFileProps } from "./UploadFile";
import styles from "../../styles/Chat.module.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import EmojiEmotionsIcon from "@material-ui/icons/EmojiEmotions";
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
import SlowDownPopUp from "./popup/SlowDownPopUp";
import { wait } from "components/utils/utils";
import { useMessage } from "context/messageContext";

export const ChatMain: React.FC = ({}) => {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [filesUploading, setFilesUploading] = useState<FileUploadingData[]>([]);
  const [lastKey, setLastKey] = useState<Timestamp>(new Timestamp(0, 0));
  const [unsubs, setUnsubs] = useState<(() => void)[]>([]);
  const [slowDownCount, setSlowDownCount] = useState<number>(0);
  const [popUpOpen, setPopUpOpen] = useState<boolean>(false);
  const [messagesEnd, setMessagesEnd] = useState<boolean>(false);
  const [canScrollToBottom, setCanScrollToBottom] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const listInnerRef = useRef<HTMLHeadingElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const { channel } = useChannel();
  const { user } = useUser();
  const { message } = useMessage();

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  const messagesCollection = collection(
    db,
    "groups",
    "H8cO2zBjCyJYsmM4g5fv",
    "categories",
    channel.idC,
    "channels",
    channel.id,
    "messages"
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [popUpOpen]);

  useEffect(() => {
    const { scrollTop, scrollHeight, clientHeight } = listInnerRef.current!;
    if (scrollTop >= scrollHeight - clientHeight - 60) scrollToBottom();
  }, [message]);

  useEffect(() => {
    document.addEventListener("paste", pasted);
    return () => {
      document.removeEventListener("paste", pasted);
    };
  }, [input, popUpOpen]);

  const pasted = (e: ClipboardEvent) => {
    if (
      e.clipboardData!.files[0] == undefined &&
      channel.id != "" &&
      !popUpOpen
    ) {
      if ((input + e.clipboardData!.getData("Text")).length <= 2000)
        setInput(input + e.clipboardData!.getData("Text"));
      else
        setInput((input + e.clipboardData!.getData("Text")).substring(0, 2000));
    }
  };

  const handleKeyPress = (_: KeyboardEvent) => {
    console.log(popUpOpen);
    if (document.activeElement?.tagName != "TEXTAREA" && !popUpOpen)
      textAreaRef.current!.focus();
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

  const scrollAfterWait = () => {
    wait(200).then(() => {
      if (listInnerRef.current) {
        listInnerRef.current.focus();
        scrollToBottom();
      }
    });
  };

  function callback(qMes: any) {
    return onSnapshot(qMes, (querySnapshot: any) => {
      querySnapshot.docChanges().forEach((change: any, index: number) => {
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
        querySnapshot.docChanges().forEach((change, index) => {
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
                  },
                ].sort((x, y) => {
                  return new Date(x.timestamp) > new Date(y.timestamp) ? 1 : -1;
                })
              );
            }
            if (autoScroll && querySnapshot.docChanges().length > 1) {
              if (index > 0) {
                if (
                  index > 0 &&
                  querySnapshot.docChanges()[index - 1].type !== "removed"
                )
                  scrollAfterWait();
                else if (querySnapshot.docChanges()[1].newIndex == 0)
                  scrollAfterWait();
                else if (querySnapshot.docChanges().length > 2)
                  scrollAfterWait();
              }
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
    const unsub = getMessagesFirstBatch();
    return () => {
      if (unsubs.length > 0)
        for (let i = 0; i < unsubs.length; i++) unsubs[i]();
      unsub();
    };
  }, [channel.id]);

  async function sendMessage(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (slowDownCount > 1) textAreaRef.current!.blur();
    else if (e.key == "Enter" && e.shiftKey == false && channel.id != "") {
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
        });
      }
    }
  }

  const fileUploading = (fileData: FileUploadingData) => {
    setPopUpOpen(false);
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
        <SlowDownPopUp onOk={() => setSlowDownCount(0)} />
      ) : null}
      <div className={styles.chat_shadow}>
        <ChatHeader />
      </div>
      <div
        className={styles.chat_messages}
        onScroll={(e) => handleScroll(e)}
        ref={listInnerRef}
      >
        {messages.map(({ id, content, timestamp, uid, file, edited }) => (
          <Message
            key={id}
            id={id}
            content={content}
            time={timestamp}
            userid={uid}
            file={file}
            onImageLoad={onImageLoadComplete}
            edited={edited}
          />
        ))}
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
        <UploadFile
          chatInput={input}
          uploadCallback={fileUploading}
          onPopUp={() => setPopUpOpen(true)}
          onCancel={() => setPopUpOpen(false)}
        />
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
          <EmojiEmotionsIcon fontSize="large" />
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
