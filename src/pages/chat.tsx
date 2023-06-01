import styles from "../styles/Chat.module.scss";
import { Navbar } from "../components/chat/Navbar";
import React, { useEffect, useState } from "react";
import { useUser } from "context/userContext";
import { useRouter } from "next/router";
import { ChatMain } from "components/chat/ChatMain";
import Loading from "components/Loading";
import { wait } from "components/utils/utils";
import { createFirebaseApp } from "../firebase-utils/clientApp";
import {
  DocumentData,
  DocumentSnapshot,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useChannel } from "context/channelContext";
import Members from "components/chat/Members";
import ChatHeader from "components/chat/ChatHeader";

const Chat = () => {
  const [showMembers, setShowMembers] = useState<boolean>(true); // Show members navbar

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
          await wait(500).then(async () => {
            // Setting user activity should work server side but here it works client side
            // TODO: Create some proper API and server side checks (maybe ping user every few minutes)
            if (user.uid != "") {
              await updateDoc(doc(db, "profile", user.uid), {
                isActive: true,
              });
            }
          });
          loader.remove();
        }
      }
    }

    const eventListener = async () => {
      if (user.uid != "") {
        await updateDoc(doc(db, "profile", user.uid), {
          isActive: false,
        });
      }
    };

    window.addEventListener("beforeunload", eventListener);
    window.addEventListener("unload", eventListener);

    return () => {
      window.removeEventListener("beforeunload", eventListener);
      window.removeEventListener("unload", eventListener);
    };
  }, [user.uid, loadingUser, db, router]);

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
        });
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
  }, [user.uid, channel.idG, db, setMemberData]);

  // Render only if user is authenticated
  return user.uid ? (
    <div className={styles.app}>
      <Loading />
      <Navbar />
      <div className={styles.full_chat_flexbox}>
        <div className={styles.chat_shadow}>
          <ChatHeader onMembers={() => setShowMembers(!showMembers)} />
        </div>
        <div className={styles.chat_flexbox}>
          <ChatMain />
          {showMembers && <Members />}
        </div>
      </div>
    </div>
  ) : null;
};

export default Chat;
