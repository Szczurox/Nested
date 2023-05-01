import React, { useEffect, useState } from "react";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import AddIcon from "@material-ui/icons/Add";
import styles from "../../../styles/components/chat/navbar/NavbarCategory.module.scss";
import { NavbarChannel } from "./NavbarChannel";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import { createFirebaseApp } from "../../../firebase/clientApp";
import {
  collection,
  getFirestore,
  onSnapshot,
  query,
} from "firebase/firestore";

export type NavbarCategoryVariant = "server" | "dms";

interface NavbarCategoryProps {
  idC: string;
  variant?: NavbarCategoryVariant;
  name: String;
}

export interface ChannelData {
  id: string;
  name: string;
}

export const NavbarCategory: React.FC<NavbarCategoryProps> = ({
  idC,
  name,
  variant = "server",
}) => {
  let body = null;
  const [showChannels, setShowChannels] = useState(true);
  const [channels, setChannels] = useState<ChannelData[]>([]);

  if (variant === "server") {
    body = (
      <div
        className={styles.navbar_header}
        onClick={() => setShowChannels(!showChannels)}
      >
        {showChannels ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        <h4>{name}</h4>
      </div>
    );
  } else {
    body = (
      <div className={styles.navbar_header}>
        <h4>DIRECT MESSAGES</h4>
      </div>
    );
  }

  useEffect(() => {
    const app = createFirebaseApp();
    const db = getFirestore(app!);

    async function getChannel() {
      // Channels query
      const qCha = query(
        collection(
          db,
          "groups",
          "H8cO2zBjCyJYsmM4g5fv",
          "categories",
          idC,
          "channels"
        )
      );
      onSnapshot(qCha, (querySnapshot) => {
        setChannels(
          querySnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
          }))
        );
      });
    }

    getChannel();
  }, [idC]);

  return (
    <div className="navbar_category" id={idC}>
      <div className={styles.navbar_channels_header}>
        {body}
        <AddIcon className={styles.navbar_add_channel} />
      </div>
      <div
        className="navbar_channels"
        style={{
          height: showChannels ? "auto" : "0px",
          visibility: showChannels ? "visible" : "hidden",
        }}
      >
        {channels.map(({ id, name }) => (
          <NavbarChannel key={id} id={id} idC={idC} name={name} />
        ))}
      </div>
    </div>
  );
};
