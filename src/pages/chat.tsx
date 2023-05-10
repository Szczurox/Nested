import styles from "../styles/Chat.module.scss";
import { Navbar } from "../components/chat/Navbar";
import React, { useEffect } from "react";
import { useUser } from "context/userContext";
import { useRouter } from "next/router";
import { ChatMain } from "components/chat/ChatMain";
import { createFirebaseApp } from "../firebase/clientApp";
import {
  DocumentData,
  DocumentSnapshot,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
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
  }, [user.uid, loadingUser]);

  useEffect(() => {
    async function setUserPerms(docSnapMember: DocumentSnapshot<DocumentData>) {
      if (docSnapMember.exists()) {
        setMemberData(
          docSnapMember.data().nickname,
          docSnapMember.data().permissions
        );
      }
    }

    // Adds user to members of the group if isn't one yet (temp till multiple groups)
    async function checkMember() {
      const docSnapMember = await getDoc(
        doc(db, "groups", channel.idG, "members", user.uid)
      );
      let unsub: () => void;
      if (docSnapMember.exists()) {
        unsub = onSnapshot(
          doc(db, "groups", channel.idG, "members", user.uid),
          (docSnapMember) => setUserPerms(docSnapMember)
        );
      } else {
        await setDoc(doc(db, "groups", channel.idG, "members", user.uid), {
          nickname: user.username,
          avatar: user.avatar,
          nameColor: "",
          permissions: [],
        }).catch((err) => console.log(err));
        unsub = onSnapshot(
          doc(db, "groups", channel.idG, "members", user.uid),
          (docSnapMember) => setUserPerms(docSnapMember)
        );
      }
      return unsub;
    }
    let unsub: () => void = () => undefined;
    if (user.uid != "") checkMember().then((result) => (unsub = result));
    return () => {
      unsub();
    };
  }, [user.uid, channel.idG]);

  // Render only if user is authenticated
  return user.uid ? (
    <div className={styles.app}>
      <Navbar />
      <ChatMain />
    </div>
  ) : null;
};

export default Chat;
