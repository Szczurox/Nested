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
  arrayUnion,
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import moment from "moment";
import { serverTimestamp } from "firebase/firestore";
import { useChannel } from "context/channelContext";
import { useUser } from "context/userContext";
import { useMessage } from "context/messageContext";
import { usePopUp } from "context/popUpContext";
import InformationPopUp from "./popup/InformationPopUp";
import { wait } from "components/utils/utils";
import Emoji from "./ui-icons/Emoji";

export const ChatMain: React.FC = ({}) => {
  const [input, setInput] = useState<string>(""); // Textarea input
  const [messages, setMessages] = useState<MessageData[]>([]); // Array of all messages currently loaded
  const [filesUploading, setFilesUploading] = useState<FileUploadingData[]>([]); // Array of all file progress messages
  const [emojiBucket, setEmojiBucket] = useState<string[]>([]);
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

  const textAreaSizeLimit = 2000;

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
  }, [input, popUp.isOpen, channel.id]);

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
      if (
        (input + e.clipboardData!.getData("Text")).length <= textAreaSizeLimit
      )
        setInput(input + e.clipboardData!.getData("Text"));
      else
        setInput(
          (input + e.clipboardData!.getData("Text")).substring(
            0,
            textAreaSizeLimit
          )
        );
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
      wait(300).then(() => scrollToBottom());
    }
  };

  const scrollToBottom = () => {
    if (listInnerRef.current != null) {
      listInnerRef.current.scrollTop =
        listInnerRef.current.scrollHeight - listInnerRef.current.clientHeight;
    }
  };

  const updateLastActive = async () =>
    await setDoc(
      doc(
        db,
        "groups",
        channel.idG,
        "channels",
        channel.id,
        "participants",
        user.uid
      ),
      { lastActive: serverTimestamp() }
    );

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
              ...messages.filter((el) => el.id !== change.doc.id),
              {
                id: change.doc.id,
                content: change.doc.data().content,
                timestamp: time,
                uid: change.doc.data().userid,
                file: change.doc.data().file,
                edited: change.doc.data().edited,
                fileType: change.doc.data().fileType,
                emojiBucket: change.doc.data().emojiBucket,
              },
            ].sort((x, y) => {
              return x.timestamp > y.timestamp ? 1 : -1;
            })
          );
        }
      });

      if (querySnapshot.docChanges().length < querySizeLimit)
        updateLastActive();
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

    if (channel.id != "") {
      textAreaRef.current!.focus();
      setAutoScroll(true);
      setCanScrollToBottom(false);
      const unsub = getMessagesFirstBatch();
      scrollToBottom();
      return () => {
        if (unsubs.length > 0)
          for (let i = 0; i < unsubs.length; i++) unsubs[i]();
        unsub();
      };
    }
  }, [channel.id]);

  async function sendMessage(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (slowDownCount > 1 || popUp.isOpen) {
      // Don't update input if sending messages too quickly or pop-up is open
      e.preventDefault();
      textAreaRef.current!.blur();
    } else if (e.key == "Enter" && e.shiftKey == false && channel.id != "") {
      // Get current input and reset textarea instantly, before message gets fully sent
      const chatInput = input.replace(/^\s+|\s+$/g, "");
      setInput("");
      e.preventDefault();
      if (chatInput.length) {
        await updateDoc(
          doc(db, "groups", channel.idG, "channels", channel.id),
          {
            lastMessageAt: serverTimestamp(),
          }
        ).catch((err) => console.log("Update lastMessagedAt Error: " + err));

        await addDoc(messagesCollection, {
          content: chatInput,
          userid: user.uid,
          createdAt: serverTimestamp(),
          edited: false,
          emojiBucket: arrayUnion(...emojiBucket),
        })
          .catch((err) => {
            console.log(err);
            // Create rejection is surely caused by trying to send too many messages
            setSlowDownCount(slowDownCount + 1);
          })
          .then((_) => scrollToBottom());

        // Update the time at which the last message was sent by the user
        // Rate limit user
        await updateDoc(doc(db, "profile", user.uid), {
          lastMessagedAt: serverTimestamp(),
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

  const addedEmoji = (text: string, file: string) => {
    if ((input + text).length <= textAreaSizeLimit) {
      setInput(input + text);
      if (!emojiBucket.find((el) => el[0] == text))
        setEmojiBucket((emojiBucket) => [...emojiBucket, text + "|" + file]);
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
          ({
            id,
            content,
            timestamp,
            uid,
            file,
            edited,
            fileType,
            emojiBucket,
          }) => (
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
              emojiBucket={emojiBucket}
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
          <GifIcon fontSize="large" className={styles.chat_input_icon} />
          <Emoji enabled={channel.id != ""} emojiAdded={addedEmoji} />
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
