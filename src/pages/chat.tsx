import type { NextPage } from "next";
import styles from "../styles/Chat.module.scss";
import { TextareaAutosize } from "@material-ui/core";
import EmojiEmotionsIcon from "@material-ui/icons/EmojiEmotions";
import GifIcon from "@material-ui/icons/Gif";
import { useState } from "react";
import UploadFile from "../components/chat/UploadFile";
import ChatHeader from "../components/chat/ChatHeader";
import Message from "../components/chat/Message";

const Chat: NextPage = () => {
  const [renderViewScroll, setRenderViewScroll] = useState(0);
  const [renderView, setRenderView] = useState(50);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  return (
    <div className={styles.chat}>
      <ChatHeader />
      <div className={styles.chat_messages}>
        <>
          <Message />
        </>
        <div></div>
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
            onKeyDown={(e) => console.log(e)}
            placeholder={`Message #channel`}
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

export default Chat;
