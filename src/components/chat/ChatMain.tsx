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
  getDocs,
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
  const [scrollAfterLoad, setScrollAfterLoad] = useState(false);
  const [messagesEnd, setMessagesEnd] = useState(false);
  const listInnerRef = useRef<HTMLHeadingElement>(null);

  const { channel } = useChannel();
  const { user } = useUser();

  const app = createFirebaseApp();
  const db = getFirestore(app);

  const handleScroll = (e: any) => {
    if (listInnerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listInnerRef.current;
      console.log(scrollHeight, scrollTop, clientHeight);
      if (scrollTop < 100 && !messagesEnd) {
        getMessages();
      }
    }
  };

  const scrollToBottom = () => {
    if (listInnerRef.current != null) {
      listInnerRef.current.scrollTop =
        listInnerRef.current.scrollHeight - listInnerRef.current.clientHeight;
    }
  };

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

    const unsub = onSnapshot(qMes, (querySnapshot) => {
      setMessages([
        ...querySnapshot.docs.reverse().map((doc) => ({
          id: doc.id,
          content: doc.data().content,
          timestamp: doc.data().time,
          uid: doc.data().userid,
        })),
        ...messages,
      ]);
      if (querySnapshot.docs.length > 0) {
        setLastKey(
          querySnapshot.docs[querySnapshot.docs.length - 1].data().createdAt
        );
        setMessagesEnd(false);
      } else setMessagesEnd(true);
      console.log(querySnapshot.docs.length, messagesEnd);
    });

    return unsub;
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
        setMessages(
          querySnapshot.docs.reverse().map((doc) => ({
            id: doc.id,
            content: doc.data().content,
            timestamp: doc.data().time,
            uid: doc.data().userid,
          }))
        );
        if (querySnapshot.docs.length > 0) {
          setLastKey(
            querySnapshot.docs[querySnapshot.docs.length - 1].data().createdAt
          );
          setMessagesEnd(false);
        } else setMessagesEnd(true);

        if (listInnerRef.current) {
          console.log("U MAD?");
          listInnerRef.current.focus();
          scrollToBottom();
        }
      });

      return unsub;
    }

    const unsub = getMessagesFirstBatch();
    return () => unsub();
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
        <UploadFile />
        <form>
          <TextareaAutosize
            value={input}
            wrap="soft"
            maxLength={2000}
            maxRows={10}
            disabled={false}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={sendMessage}
            placeholder={`Message #${channel.name}`}
          />
          <button
            disabled={false}
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
