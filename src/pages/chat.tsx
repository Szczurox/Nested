import styles from "../styles/Chat.module.scss";
import { Navbar } from "../components/chat/Navbar";
import React, { useEffect } from "react";
import { useUser } from "context/userContext";
import { useRouter } from "next/router";
import { ChatMain } from "components/chat/ChatMain";

const Chat = () => {
  const { user, loadingUser } = useUser();
  const router = useRouter();

  // Route to login if user is not authenticated
  useEffect(() => {
    if (user.uid == "" && !loadingUser) router.push("/login");
  });

  // Render only if user is authenticated
  return user.uid ? (
    <div className={styles.app}>
      <Navbar />
      <ChatMain />
    </div>
  ) : null;
};

export default Chat;
