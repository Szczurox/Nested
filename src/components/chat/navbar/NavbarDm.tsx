import React, { useEffect, useState } from "react";
import styles from "../../../styles/components/chat/navbar/NavbarDm.module.scss";
import { Avatar } from "@material-ui/core";
import { doc, getFirestore, onSnapshot } from "firebase/firestore";
import { createFirebaseApp } from "../../../firebase-utils/clientApp";
import moment, { Moment } from "moment";

interface NavbarDmProps {
  id?: string;
  name?: string;
  nameColor?: string;
  avatar?: string;
}

export interface NavbarDmData {
  id: string;
  name: string;
  nameColor: string;
  avatar: string;
}

export const NavbarDm: React.FC<NavbarDmProps> = ({
  id = "",
  name = "test",
  nameColor,
  avatar,
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [lastActive, setLastActive] = useState<Moment>();

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  // useEffect(() => {
  //   function onMemberLoad() {
  //     return onSnapshot(doc(db, "profile", id), (doc) => {
  //       if (doc.exists() && doc.data().lastActive) {
  //         setLastActive(moment(doc.data().lastActive.toMillis()).add(3, "m"));
  //         setIsActive(
  //           moment(doc.data().lastActive.toMillis())
  //             .add(3, "m")
  //             .isAfter(moment())
  //         );
  //       }
  //     });
  //   }

  //   const unsub = onMemberLoad();
  //   return () => unsub();
  // }, []);

  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     if (lastActive) {
  //       setIsActive(lastActive.isAfter(moment()));
  //     } else setIsActive(false);
  //   }, 1500);

  //   return () => clearInterval(interval);
  // });

  return (
    <div className={styles.dm} id={id}>
      <div className={styles.dm_avatar}>
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
      <span className={styles.dm_activity_background} />
      <span
        className={styles.dm_activity}
        style={{ backgroundColor: isActive ? "#00ff40" : "grey" }}
      />
    </div>
  );
};
