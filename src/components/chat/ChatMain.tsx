import { TextareaAutosize } from "@material-ui/core";
import React, { useEffect, useState } from "react";
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

export interface MessageData {
  id: string;
  content: string;
  timestamp: string;
}

export const ChatMain: React.FC = ({}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [renderViewScroll, setRenderViewScroll] = useState(0);
  const [renderView, setRenderView] = useState(50);
  const [lastKey, setLastKey] = useState<Timestamp>(new Timestamp(0, 0));
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesEnd, setMessagesEnd] = useState(false);

  const app = createFirebaseApp();
  const db = getFirestore(app);
  const { channel } = useChannel();

  const fetchMorePosts = (key: any) => {
    if (lastKey!.seconds != undefined) {
      setMessagesLoading(true);
      getMessages(key);
      setMessagesLoading(false);
    }
  };

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
        }))
      );
      if (querySnapshot.docs.length > 0) {
        setLastKey(
          querySnapshot.docs[querySnapshot.docs.length - 1].data().createdAt
        );
        setMessagesEnd(false);
      } else setMessagesEnd(true);
    });

    return unsub;
  }

  function getMessages(key: string) {
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
      startAfter(key)
    );

    const unsub = onSnapshot(qMes, (querySnapshot) => {
      setMessages([
        ...querySnapshot.docs.reverse().map((doc) => ({
          id: doc.id,
          content: doc.data().content,
          timestamp: doc.data().time,
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
    const unsub = getMessagesFirstBatch();
    return () => unsub();
  }, [channel.id, getMessagesFirstBatch]);

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
          }
        );
      }
      setInput("");
    }
  }

  return (
    <div className={styles.chat}>
      <ChatHeader />
      <div style={{ textAlign: "center" }}>
        {messagesLoading ? (
          <p>Loading..</p>
        ) : !messagesEnd ? (
          <button onClick={() => fetchMorePosts(lastKey)}>More Messages</button>
        ) : (
          <span>You are up to date!</span>
        )}
      </div>
      <div className={styles.chat_messages}>
        {messages.map(({ id, content, timestamp }) => (
          <Message key={id} id={id} content={content} timestamp={timestamp} />
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
