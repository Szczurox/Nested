import React, { useEffect, useRef, useState } from "react";
import styles from "../../../styles/components/chat/members/Member.module.scss";
import { Avatar } from "@material-ui/core";
import { doc, getFirestore, onSnapshot } from "firebase/firestore";
import { createFirebaseApp } from "../../../firebase-utils/clientApp";

interface MemberProps {
  id: string;
  name: string;
  nameColor: string;
  avatar: string;
}

export interface MemberData {
  id: string;
  name: string;
  nameColor: string;
  avatar: string;
}

export const Member: React.FC<MemberProps> = ({
  id,
  name,
  nameColor,
  avatar,
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  useEffect(() => {
    function onMemberLoad() {
      return onSnapshot(doc(db, "profile", id), (doc) => {
        if (doc.exists()) setIsActive(doc.data().isActive);
      });
    }

    const unsub = onMemberLoad();
    return () => unsub();
  }, []);

  return (
    <div className={styles.member} id={id}>
      <div className={styles.member_avatar}>
        <Avatar
          style={{ height: "45px", width: "45px" }}
          src={
            avatar
              ? avatar
              : "https://www.pngall.com/wp-content/uploads/5/User-Profile-PNG-High-Quality-Image.png"
          }
        />
      </div>
      <h4 style={{ color: nameColor ? nameColor : "white" }}>{name}</h4>{" "}
      <span className={styles.member_activity_background} />
      <span
        className={styles.member_activity}
        style={{ backgroundColor: isActive ? "#00ff40" : "grey" }}
      />
    </div>
  );
};
