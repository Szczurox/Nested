import { TextareaAutosize } from "@material-ui/core";
import React, { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import Message from "./Message";
import UploadFile from "./UploadFile";
import styles from "../../styles/Chat.module.scss";
import EmojiEmotionsIcon from "@material-ui/icons/EmojiEmotions";
import GifIcon from "@material-ui/icons/Gif";
import { createFirebaseApp } from "../../firebase/clientApp";
import {
  addDoc,
  collection,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  Timestamp,
} from "firebase/firestore";
import moment from "moment";
import { serverTimestamp } from "firebase/firestore";
import { useChannel } from "context/channelContext";
import { useUser } from "context/userContext";

export interface MessageData {
  id: string;
  content: string;
  timestamp: string;
  uid: string;
}

export const ChatMain: React.FC = ({}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [lastKey, setLastKey] = useState<Timestamp>(new Timestamp(0, 0));
  const [messagesEnd, setMessagesEnd] = useState(false);
  const listInnerRef = useRef<HTMLHeadingElement>(null);

  const { channel } = useChannel();
  const { user } = useUser();

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  const handleScroll = (e: any) => {
    console.log(listInnerRef.current?.scrollHeight);
    if (listInnerRef.current) {
      const { scrollTop } = listInnerRef.current;
      if (scrollTop < 300 && !messagesEnd) {
        const unsub = getMessages();
        listInnerRef.current.scrollTop += 300;
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
        if (change.type === "added") {
          setMessages((messages) => [
            {
              id: change.doc.id,
              content: change.doc.data().content,
              timestamp: change.doc.data().time,
              uid: change.doc.data().userid,
            },
            ...messages.filter((el) => el.id !== change.doc.id),
          ]);
        }
        if (change.type === "modified") {
          console.log("Modified: ", change.doc.data());
        }
        if (change.type === "removed") {
          console.log("Removed: ", change.doc.data());
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
      collection(
        db,
        "groups",
        "H8cO2zBjCyJYsmM4g5fv",
        "categories",
        channel.idC,
        "channels",
        channel.id,
        "messages"
      ),
      orderBy("createdAt", "desc"),
      limit(20),
      startAfter(lastKey)
    );

    return callback(qMes);
  }

  useEffect(() => {
    function getMessagesFirstBatch() {
      // Channels query
      const qMes = query(
        collection(
          db,
          "groups",
          "H8cO2zBjCyJYsmM4g5fv",
          "categories",
          channel.idC,
          "channels",
          channel.id,
          "messages"
        ),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      const unsub = onSnapshot(qMes, (querySnapshot) => {
        const { scrollTop, scrollHeight, clientHeight } = listInnerRef.current!;
        let scroll = scrollTop >= scrollHeight - clientHeight - 100;

        querySnapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            if (!messages.map((el) => el.id).includes(change.doc.id)) {
              setMessages((messages) => [
                ...messages.filter((el) => el.id !== change.doc.id),
                {
                  id: change.doc.id,
                  content: change.doc.data().content,
                  timestamp: change.doc.data().time,
                  uid: change.doc.data().userid,
                },
              ]);
            }
          }
          if (change.type === "removed") {
            setMessages((messages) => [
              ...messages.filter((el) => el.id !== change.doc.id),
            ]);
          }
        });

        if (querySnapshot.docs.length > 0) {
          setLastKey(
            querySnapshot.docs[querySnapshot.docs.length - 1].data().createdAt
          );
          setMessagesEnd(false);
        } else setMessagesEnd(true);

        if (listInnerRef.current && scroll) {
          listInnerRef.current.focus();
          scrollToBottom();
        }
      });

      return unsub;
    }

    setMessages([]);
    const unsub = getMessagesFirstBatch();
    return unsub;
  }, [channel.id]);

  async function sendMessage(e: any) {
    // Send Message
    if (e.keyCode == 13 && e.shiftKey == false && channel.id != "") {
      e.preventDefault();
      if (input.replace(/\s/g, "").length) {
        await addDoc(
          collection(
            db,
            "groups",
            "H8cO2zBjCyJYsmM4g5fv",
            "categories",
            channel.idC,
            "channels",
            channel.id,
            "messages"
          ),
          {
            createdAt: serverTimestamp(),
            time: moment().utcOffset("+00:00").format(),
            content: input,
            userid: user.uid,
            username: user.username,
          }
        );
      }
      setInput("");
    }
  }

  return (
    <div className={styles.chat}>
      <ChatHeader />
      <div
        className={styles.chat_messages}
        onScroll={(e) => handleScroll(e)}
        ref={listInnerRef}
      >
        {messages.map(({ id, content, timestamp, uid }) => (
          <Message
            key={id}
            id={id}
            content={content}
            time={timestamp}
            userid={uid}
          />
        ))}
      </div>
      <div className={styles.chat_input}>
        <UploadFile disabled={channel.id == ""} chatInput={input} />
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
          />
          <button
            disabled={channel.id == ""}
            className={styles.chat_inputButton}
            type="submit"
          >
            Send Message
          </button>
        </form>
        <div className={styles.chat_inputIcons}>
          <GifIcon fontSize="large" />
          <EmojiEmotionsIcon fontSize="large" />
        </div>
      </div>
    </div>
  );
};
