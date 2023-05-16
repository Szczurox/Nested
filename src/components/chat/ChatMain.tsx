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
  const [input, setInput] = useState<string>(""); // Textarea input
  const [messages, setMessages] = useState<MessageData[]>([]); // Array of all messages currently loaded
  const [filesUploading, setFilesUploading] = useState<FileUploadingData[]>([]); // Array of all file progress messages
  const [unsubs, setUnsubs] = useState<(() => void)[]>([]); // Array of all unsubscribers
  const [lastKey, setLastKey] = useState<Timestamp>(new Timestamp(0, 0)); // Creation date of the last message fetched
  const [slowDownCount, setSlowDownCount] = useState<number>(0); // Show Slow Down pop-up if reaches 2
  const [messagesEnd, setMessagesEnd] = useState<boolean>(false); // True if no more messages to load on the current channel
  const [canScrollToBottom, setCanScrollToBottom] = useState<boolean>(false); // Show Scroll To Bottom button
  const [isLoading, setIsLoading] = useState<boolean>(false); // Are messages loading
  const [autoScroll, setAutoScroll] = useState<boolean>(true); // Can autoscroll (used when new messages appear)

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

  const querySizeLimit = 20;

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = listInnerRef.current!;
    setAutoScroll(scrollTop >= scrollHeight - clientHeight - 100);

    if (listInnerRef.current) {
      const { scrollTop, scrollHeight } = listInnerRef.current;
      if (
        isLoading &&
        e.currentTarget.scrollTop < e.currentTarget.scrollHeight / 4 - 202
      )
        e.currentTarget.scrollTop = e.currentTarget.scrollHeight / 4 + 101;
      if (scrollTop < scrollHeight / 4 && !messagesEnd) {
        if (!isLoading) {
          setIsLoading(true);
          const unsub = getMessages();
          setUnsubs([...unsubs, unsub]);
        }
      }
      if (scrollTop < scrollHeight / 1.9 && messages.length > 60) {
        setCanScrollToBottom(true);
      } else {
        setCanScrollToBottom(false);
      }
    }
  };

  const onImageLoadComplete = () => {
    if (listInnerRef.current && autoScroll) {
      listInnerRef.current.focus();
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    if (listInnerRef.current != null) {
      listInnerRef.current.scrollTop =
        listInnerRef.current.scrollHeight - listInnerRef.current.clientHeight;
    }
  };

  const handleMessageSnapshot = (qMes: any) => {
    return onSnapshot(qMes, (querySnapshot: any) => {
      querySnapshot.docChanges().forEach((change: any) => {
        if (change.type === "removed" || change.type === "modified") {
          setMessages((messages) => [
            ...messages.filter((el) => el.id !== change.doc.id),
          ]);
        }
        if (
          (change.type === "added" || change.type === "modified") &&
          change.doc.data().createdAt != null
        ) {
          let time: number =
            change.doc.data().createdAt.seconds * 1000 +
            change.doc.data().createdAt.nanoseconds / 1000000;
          setMessages((messages) =>
            [
              {
                id: change.doc.id,
                content: change.doc.data().content,
                timestamp: time,
                uid: change.doc.data().userid,
                file: change.doc.data().file,
                edited: change.doc.data().edited,
                fileType: change.doc.data().fileType,
              },
              ...messages.filter((el) => el.id !== change.doc.id),
            ].sort((x, y) => {
              return x.timestamp > y.timestamp ? 1 : -1;
            })
          );
        }
      });
      if (querySnapshot.docs.length > 0) {
        setLastKey(
          querySnapshot.docs[querySnapshot.docs.length - 1].data().createdAt
        );
        setMessagesEnd(false);
      } else setMessagesEnd(true);
      setIsLoading(false);
    });
  };

  function getMessages() {
    // Channels query
    const qMes = query(
      messagesCollection,
      orderBy("createdAt", "desc"),
      limit(querySizeLimit),
      startAfter(lastKey)
    );

    return handleMessageSnapshot(qMes);
  }

  useEffect(() => {
    function getMessagesFirstBatch() {
      // Channels query
      const qMes = query(
        messagesCollection,
        orderBy("createdAt", "desc"),
        limit(querySizeLimit)
      );

      return handleMessageSnapshot(qMes);
    }

    setMessages([]);
    textAreaRef.current!.focus();
    setAutoScroll(true);
    setCanScrollToBottom(false);
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
      // Get current input and reset textarea instantly, before message gets fully sent
      const chatInput = input.replace(/^\s+|\s+$/g, "");
      setInput("");
      e.preventDefault();
      if (chatInput.length) {
        await addDoc(messagesCollection, {
          content: chatInput,
          userid: user.uid,
          createdAt: timestamp,
          edited: false,
        })
          .catch((_) => {
            // Create rejection is surely caused by trying to send too many messages
            setSlowDownCount(slowDownCount + 1);
          })
          .then((_) => scrollToBottom());

        // Update the time at which the last message was sent by the user
        // Rate limit user
        await updateDoc(doc(db, "profile", user.uid), {
          lastMessagedAt: timestamp,
        }).catch((err) => {
          console.log(err);
        });
      }
    }
  }

  // Message at the bottom that show file upload progress
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
          ({ id, content, timestamp, uid, file, edited, fileType }, index) => (
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
              time={moment().utcOffset("+00:00").valueOf()}
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
          <Emoji enabled={channel.id != ""} />
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
