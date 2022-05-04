import styles from "../styles/Chat.module.scss";
import { Navbar } from "../components/chat/Navbar";
import React, { useEffect, useState } from "react";
import { useUser } from "context/userContext";
import { useRouter } from "next/router";
import { ChatMain } from "components/chat/ChatMain";

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
      <ChatMain />
    </div>
  ) : null;
};

export default Chat;
