import styles from "../styles/Chat.module.scss";
import { Navbar } from "../components/chat/Navbar";
import React, { useEffect } from "react";
import { useUser } from "context/userContext";
import { useRouter } from "next/router";
import { ChatMain } from "components/chat/ChatMain";
import Loading from "components/Loading";
import { wait } from "components/utils/utils";
import { createFirebaseApp } from "../firebase/clientApp";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useChannel } from "context/channelContext";

const Chat = () => {
  const { user, loadingUser, setUserPermissions } = useUser();
  const { channel } = useChannel();

  const router = useRouter();

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  // Route to login if user is not authenticated
  useEffect(() => {
    if (user.uid == "" && !loadingUser) router.push("/login");
    else loading();

    async function loading() {
      if (typeof window !== "undefined") {
        const loader = document.getElementById("globalLoader");
        if (loader) {
          await wait(1500);
          loader.remove();
        }
      }
    }
  });

  useEffect(() => {
    async function setUserPerms() {
      const docSnapMember = await getDoc(
        doc(db, "groups", channel.idG, "members", user.uid)
      );
      if (docSnapMember.exists())
        setUserPermissions(docSnapMember.data().permissions);
    }

    if (user.uid != "") setUserPerms();
  }, [user.uid]);

  // Render only if user is authenticated
  return user.uid ? (
    <div className={styles.app}>
      <Loading />
      <Navbar />
      <ChatMain />
    </div>
  ) : null;
};

export default Chat;
