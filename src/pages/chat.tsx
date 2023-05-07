import styles from "../styles/Chat.module.scss";
import { Navbar } from "../components/chat/Navbar";
import React, { useEffect } from "react";
import { useUser } from "context/userContext";
import { useRouter } from "next/router";
import { ChatMain } from "components/chat/ChatMain";
import Loading from "components/Loading";
import { wait } from "components/utils/utils";
import { createFirebaseApp } from "../firebase/clientApp";
import {
  DocumentData,
  QueryDocumentSnapshot,
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import { useChannel } from "context/channelContext";

const Chat = () => {
  const { user, loadingUser, setMemberData } = useUser();
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
    async function setUserPerms(
      docSnapMember: QueryDocumentSnapshot<DocumentData>
    ) {
      setMemberData(
        docSnapMember.data().nickname,
        docSnapMember.data().permissions
      );
    }

    // Adds user to members of the group if isn't one yet (temp till multiple groups)
    async function checkMember() {
      const docSnapMember = await getDoc(
        doc(db, "groups", channel.idG, "members", user.uid)
      );
      if (docSnapMember.exists()) setUserPerms(docSnapMember);
      else {
        await setDoc(doc(db, "groups", channel.idG, "members", user.uid), {
          nickname: user.username,
          avatar: user.avatar,
          nameColor: "",
          permissions: [],
        }).catch((err) => console.log(err));
      }
    }

    if (user.uid != "") checkMember();
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
