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
    console.log(isMobile);
    if (isMobile) setShowMembers(false);
  }, [isMobile]);

  useEffect(() => {
    const eventListener = () => {
      fetch("/api/user-end-session", {
        method: "post",
        headers: {
          "authorization": `${user.token}`,
        },
        keepalive: true,
        body: JSON.stringify({
          channelId: lastChannelId == "" ? channel.id : lastChannelId,
          guildId: channel.idG,
        }),
      });
    };

    window.addEventListener("beforeunload", eventListener);
    window.addEventListener("unload", eventListener);

    return () => {
      window.removeEventListener("beforeunload", eventListener);
      window.removeEventListener("unload", eventListener);
    };
  }, [lastChannelId, user.uid, user.token, channel.idG, channel.id]);

  useEffect(() => {
    setLastChannelId(channel.id);
  }, [channel.id]);

  // Route to login if user is not authenticated
  useEffect(() => {
    if (user.uid == "" && !loadingUser) router.push("/login");
    else loading();

    async function loading() {
      if (typeof window !== "undefined") {
        const loader = document.getElementById("globalLoader");
        if (loader) {
          await wait(600).then(async () => {
            // Setting user activity should work server side but here it works client side
            // TODO: Create some proper API and server side checks (maybe ping user every few minutes) (corn jobs?)
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
