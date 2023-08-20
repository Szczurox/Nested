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
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useChannel } from "context/channelContext";
import Members from "components/chat/Members";
import ChatHeader from "components/chat/ChatHeader";
import useMediaQuery from "@mui/material/useMediaQuery";

const Chat = () => {
  const [showMembers, setShowMembers] = useState<boolean>(true); // Show members navbar
  const [showNavbar, setShowNavbar] = useState<boolean>(true); // Show channels navbar
  const [lastChannelId, setLastChannelId] = useState<string>(""); // Id of the last channel user was on

  const { user, loadingUser, setMemberData } = useUser();
  const { channel } = useChannel();

  const router = useRouter();

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  const isMobile = useMediaQuery("(pointer: none), (pointer: coarse)");

  useEffect(() => {
    console.log("isMobile: " + isMobile);
    if (isMobile) setShowMembers(false);
  }, [isMobile]);

  useEffect(() => {
    if (user.uid != "") {
      // Ping server with activity update every 2.5 minutes
      const interval = setInterval(async () => {
        await updateDoc(doc(db, "profile", user.uid), {
          lastActive: serverTimestamp(),
        });
      }, 150000);

      return () => clearInterval(interval);
    }
  }, [user.uid]);

  // Not the best solution for now but should mostly work
  useEffect(() => {
    const eventListener = () => {
      return updateDoc(
        doc(
          db,
          "groups",
          channel.idG,
          "channels",
          channel.id,
          "participants",
          user.uid
        ),
        {
          isTyping: false,
        }
      );
    };

    window.addEventListener("beforeunload", eventListener);
    window.addEventListener("unload", eventListener);

    return () => {
      window.removeEventListener("beforeunload", eventListener);
      window.removeEventListener("unload", eventListener);
    };
  }, [lastChannelId, user.uid, user.token, channel.idG, channel.id]);

  useEffect(() => {
    const id = lastChannelId;

    async function isNotTyping() {
      await updateDoc(
        doc(
          db,
          "groups",
          channel.idG,
          "channels",
          id,
          "participants",
          user.uid
        ),
        {
          isTyping: false,
        }
      );
    }

    isNotTyping();

    setLastChannelId(channel.id);
  }, [channel.id, user.uid]);

  // Route to login if user is not authenticated
  useEffect(() => {
    if (user.uid == "" && !loadingUser) router.push("/login");
    else loading();

    async function loading() {
      if (typeof window !== "undefined") {
        const loader = document.getElementById("globalLoader");
        if (loader) {
          await wait(600).then(async () => {
            // Notify server that user is active
            if (user.uid != "") {
              await updateDoc(doc(db, "profile", user.uid), {
                lastActive: serverTimestamp(),
              });
            }
          });
          loader.remove();
        }
      }
    }
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
      const memberDoc = doc(db, "groups", channel.idG, "members", user.uid);
      const docSnapMember = await getDoc(memberDoc);
      let unsub: () => void;
      if (docSnapMember.exists()) {
        unsub = onSnapshot(memberDoc, (docSnapMember) =>
          setUserPerms(docSnapMember)
        );
      } else {
        await setDoc(memberDoc, {
          nickname: user.username,
          avatar: user.avatar,
          nameColor: "",
          permissions: [],
        });
        unsub = onSnapshot(memberDoc, (docSnapMember) =>
          setUserPerms(docSnapMember)
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
      <Loading />
      {!isMobile || showNavbar ? (
        <Navbar hideNavbar={() => setShowNavbar(false)} />
      ) : null}
      <div className={styles.full_chat_flexbox}>
        <div className={styles.chat_shadow}>
          <ChatHeader
            onMembers={() => setShowMembers(!showMembers)}
            isMembersOpen={showMembers}
            isNavbarOpen={showNavbar ? true : false}
            setShowNavbar={(show) => setShowNavbar(show)}
          />
        </div>
        <div className={styles.chat_flexbox}>
          <ChatMain
            isNavbarOpen={showNavbar}
            hideNavbar={() => {
              setShowNavbar(false);
              if (isMobile) setShowMembers(false);
            }}
            isMembersOpen={showMembers}
          />
          {showMembers && <Members />}
        </div>
      </div>
    </div>
  ) : null;
};

export default Chat;
