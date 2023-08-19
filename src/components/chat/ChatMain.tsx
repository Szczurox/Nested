import { TextareaAutosize } from "@material-ui/core";
import { ProgressBar } from "react-bootstrap";
import React, { useEffect, useRef, useState } from "react";
import Message, { MessageData } from "./Message";
import UploadFile, { FileUploadingData } from "./UploadFile";
import styles from "../../styles/Chat.module.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import SendIcon from "@mui/icons-material/Send";
import GifIcon from "@material-ui/icons/Gif";
import { createFirebaseApp } from "../../firebase-utils/clientApp";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  documentId,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
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
import DotsLoading from "components/animations/DotsLoading";
import useMediaQuery from "@mui/material/useMediaQuery";

interface ChatMainProps {
  isNavbarOpen: boolean;
  isMembersOpen: boolean;
  hideNavbar: () => void;
}

export const ChatMain: React.FC<ChatMainProps> = ({
  isNavbarOpen,
  isMembersOpen,
  hideNavbar,
}) => {
  const [input, setInput] = useState<string>(""); // Textarea input
  const [messages, setMessages] = useState<MessageData[]>([]); // Array of all messages currently loaded
  const [filesUploading, setFilesUploading] = useState<FileUploadingData[]>([]); // Array of all file progress messages
  const [emojiBucket, setEmojiBucket] = useState<string[]>([]); // Array of all the emoji name|link used in the message
  const [typingUsers, setTypingUsers] = useState<[string, string][]>([]); // Array of users that are currenty typing (except the user)
  const [unsubs, setUnsubs] = useState<(() => void)[]>([]); // Array of all unsubscribers
  const [lastKey, setLastKey] = useState<Timestamp>(new Timestamp(0, 0)); // Creation date of the last message fetched
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout>(
    setTimeout(() => null, 0)
  );
  const [slowDownCount, setSlowDownCount] = useState<number>(0); // Show Slow Down pop-up if reaches 2
  const [messagesEnd, setMessagesEnd] = useState<boolean>(false); // True if no more messages to load on the current channel
  const [canScrollToBottom, setCanScrollToBottom] = useState<boolean>(false); // Show Scroll To Bottom button
  const [isLoading, setIsLoading] = useState<boolean>(false); // Are messages loading
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true); // Can autoscroll (used when new messages appear)

  const listInnerRef = useRef<HTMLHeadingElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const isMobile = useMediaQuery("(pointer: none), (pointer: coarse)");

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

  const participantsCollection = collection(
    db,
    "groups",
    channel.idG,
    "channels",
    channel.id ? channel.id : "None",
    "participants"
  );

  const querySizeLimit = 20;

  const textAreaSizeLimit = 2000;

  useEffect(() => {
    setIsDisabled(!user.partPermissions.includes("SEND_MESSAGES"));
  }, [channel.id, user.partPermissions]);

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
      textAreaRef.current!.focus();
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
    await updateDoc(
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

    async function getTypingUsersOnJoin() {
      const qPartOnJoin = query(
        participantsCollection,
        where(documentId(), "!=", user.uid),
        where("isTyping", "==", true)
      );

      const snapshot = await getDocs(qPartOnJoin);

      setTypingUsers(snapshot.docs.map((el) => [el.id, el.data().nickname]));
    }

    function getTypingUsers() {
      // Participants querry
      const qPart = query(
        participantsCollection,
        where(documentId(), "!=", user.uid)
      );

      return onSnapshot(qPart, (querySnapshot) => {
        querySnapshot.docChanges().forEach((change) => {
          if (change.type == "modified") {
            // User is typing
            if (
              change.doc.data().isTyping &&
              typingUsers.find((el) => el[0] == change.doc.id) == undefined
            )
              setTypingUsers((users) => [
                ...users.filter((el) => el[0] != change.doc.id),
                [change.doc.id, change.doc.data().nickname],
              ]);
            // User stopped typing
            else if (!change.doc.data().isTyping)
              setTypingUsers((users) => [
                ...users.filter((el) => el[0] != change.doc.id),
              ]);
          }
        });
      });
    }

    setMessages([]);
    setTypingUsers([]);

    if (channel.id != "") {
      if (!isMobile) textAreaRef.current!.focus();
      getTypingUsersOnJoin();
      setAutoScroll(true);
      setCanScrollToBottom(false);
      updateIsTyping(false);
      const unsub = getMessagesFirstBatch();
      const unsub2 = getTypingUsers();
      scrollToBottom();
      return () => {
        if (unsubs.length > 0)
          for (let i = 0; i < unsubs.length; i++) unsubs[i]();
        unsub();
        unsub2();
      };
    }
  }, [channel.id]);

  const updateIsTyping = async (isTyping: boolean) => {
    setIsTyping(isTyping);
    await updateDoc(
      doc(
        db,
        "groups",
        channel.idG,
        "channels",
        channel.id,
        "participants",
        user.uid
      ),
      {
        isTyping: isTyping,
      }
    );
  };

  async function userTyping() {
    if (!isTyping) {
      clearTimeout(typingTimeout);

      console.log("started typing");
      updateIsTyping(true);

      setTypingTimeout(
        setTimeout(async () => {
          console.log("done typing");
          updateIsTyping(false);
        }, 5000)
      );
    }
  }

  async function getEmojis(text: string) {
    const emojiCollection = collection(db, "groups", channel.idG, "emoji");
    const emojiSplit = text.split(/(<:.*?:>+)/g);
    let emojis: string[] = [""];
    emojiSplit.forEach(async (el) => {
      if (
        el.startsWith("<:") &&
        el.endsWith(":>") &&
        el.includes("?") &&
        !emojis.includes(el)
      ) {
        if (!emojiBucket.find((e) => e.split("|")[0] == el)) {
          const name = el.split("?")[0].slice(2);
          const doc = await getDocs(
            query(emojiCollection, where("name", "==", name))
          );
          const file = doc.docs[0].data().file;
          console.log(
            el,
            file,
            emojiBucket,
            emojiBucket.find((e) => e[0] == el)
          );
          if (!doc.empty && file)
            setEmojiBucket((emojiBucket) => [...emojiBucket, el + "|" + file]);
          else emojis = [...emojis, el];
        }
      }
    });
  }

  async function sendMessage() {
    // Get current input and reset textarea instantly, before message gets fully sent
    const chatInput = input.replace(/^\s+|\s+$/g, "");
    setInput("");
    if (chatInput.length) {
      setInput("");
      await updateDoc(doc(db, "groups", channel.idG, "channels", channel.id), {
        lastMessageAt: serverTimestamp(),
      }).catch((err) => console.log("Update lastMessagedAt Error: " + err));

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

      setEmojiBucket([]);
    }
  }

  async function sendMessageMobile() {
    userTyping();
    if (slowDownCount > 1 || popUp.isOpen) {
      // Don't update input if sending messages too quickly or pop-up is open
      textAreaRef.current!.blur();
    } else if (channel.id != "") {
      sendMessage();
    }
  }

  async function checkMessage(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    userTyping();
    if (input.includes(":>") && input.includes("<:")) await getEmojis(input);
    if (slowDownCount > 1 || popUp.isOpen) {
      // Don't update input if sending messages too quickly or pop-up is open
      e.preventDefault();
      textAreaRef.current!.blur();
    } else if (
      e.key == "Enter" &&
      e.shiftKey == false &&
      channel.id != "" &&
      !isMobile
    ) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function checkPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    console.log(e.clipboardData.getData("text"));
    await getEmojis(e.clipboardData.getData("text"));
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
      textAreaRef.current!.focus();
      setInput(input + text);
      if (!emojiBucket.find((el) => el[0] == text))
        setEmojiBucket((emojiBucket) => [...emojiBucket, text + "|" + file]);
    }
  };

  const showTypingUsers = () => {
    if (typingUsers.length > 3) return "many people are typing...";
    if (typingUsers.length == 3)
      return `${typingUsers[0][1]}, ${typingUsers[1][1]} and ${typingUsers[2][1]} are typing...`;
    if (typingUsers.length == 2)
      return `${typingUsers[0][1]} and ${typingUsers[1][1]} are typing...`;
    if (typingUsers.length == 1) return `${typingUsers[0][1]} is typing...`;
  };

  return (
    <div
      className={
        isNavbarOpen
          ? `${styles.chat} ${styles.chat_mobile_navbar}`
          : isMembersOpen
          ? `${styles.chat} ${styles.chat_mobile_members}`
          : styles.chat
      }
      onClick={
        isNavbarOpen || isMembersOpen ? (_) => hideNavbar() : (_) => null
      }
    >
      {slowDownCount > 1 ? (
        <InformationPopUp
          onOk={() => wait(1500).then(() => setSlowDownCount(0))}
        >
          <h3>Slow down!</h3>
          <p>You are trying to send messages too quickly.</p>
        </InformationPopUp>
      ) : null}
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
        {!isDisabled ? (
          <UploadFile chatInput={input} uploadCallback={fileUploading} />
        ) : null}
        <form>
          <TextareaAutosize
            value={input}
            wrap="soft"
            maxLength={2000}
            maxRows={input ? 10 : 1}
            disabled={channel.id == "" || isDisabled}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={checkMessage}
            onPasteCapture={checkPaste}
            placeholder={
              !isDisabled
                ? `Message #${channel.name}`
                : `You don't have permission to message #${channel.name}`
            }
            ref={textAreaRef}
          />
          <button
            disabled={channel.id == "" || !isDisabled}
            className={styles.chat_input_button}
            type="submit"
          ></button>
        </form>
        <div className={styles.chat_input_icons}>
          <GifIcon fontSize="large" className={styles.chat_input_icon} />
          <Emoji enabled={channel.id != ""} emojiAdded={addedEmoji} />
          {isMobile && input != "" ? (
            <SendIcon
              className={styles.chat_input_icon}
              onClick={() => sendMessageMobile()}
            />
          ) : null}
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
      <span>
        {typingUsers.length != 0 && (
          <span style={{ marginLeft: "45px" }}>
            <DotsLoading />
          </span>
        )}
        <span
          className={
            typingUsers.length
              ? styles.chat_typing_users
              : styles.chat_no_typing_users
          }
        >
          {showTypingUsers()}
        </span>
      </span>
    </div>
  );
};
