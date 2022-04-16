import styles from "../styles/Chat.module.scss";
import { Navbar } from "../components/chat/Navbar";
import { TextareaAutosize } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import ChatHeader from "../components/chat/ChatHeader";
import Message from "../components/chat/Message";
import UploadFile from "../components/chat/UploadFile";
import EmojiEmotionsIcon from "@material-ui/icons/EmojiEmotions";
import GifIcon from "@material-ui/icons/Gif";
import { useUser } from "context/userContext";
import { useRouter } from "next/router";

const Chat = () => {
  const [input, setInput] = useState("");
  const { user, loadingUser } = useUser();
  const router = useRouter();

  // Push back to index if user not authenticated
  useEffect(() => {
    if (!loadingUser && !user.uid) router.push("/");
  }, [user, loadingUser]);

  // Render only if user is authenticated
  return user.uid ? (
    <div className={styles.app}>
      <Navbar />
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
    </div>
  ) : null;
};

export default Chat;
