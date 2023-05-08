import React, { useEffect, useState } from "react";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import AddIcon from "@material-ui/icons/Add";
import styles from "../../../styles/components/chat/navbar/NavbarCategory.module.scss";
import { NavbarChannel } from "./NavbarChannel";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import { createFirebaseApp } from "../../../firebase/clientApp";
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { useUser } from "context/userContext";
import { useChannel } from "context/channelContext";
import CreateChannelPopUp from "../popup/CreateChannelPopUp";

export type NavbarCategoryVariant = "server" | "dms";

interface NavbarCategoryProps {
  idC: string;
  variant?: NavbarCategoryVariant;
  name: string;
}

export interface ChannelData {
  id: string;
  name: string;
  createdAt: string;
}

export const NavbarCategory: React.FC<NavbarCategoryProps> = ({
  idC,
  name,
  variant = "server",
}) => {
  let body = null;
  const [showChannels, setShowChannels] = useState<boolean>(true);
  const [canManageChannels, setCanManageChannels] = useState<boolean>(false);
  const [showPopUp, setShowPopUp] = useState<boolean>(false);
  const [channels, setChannels] = useState<ChannelData[]>([]);

  const { user } = useUser();
  const { channel } = useChannel();

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  const channelsCollection = collection(
    db,
    "groups",
    channel.idG,
    "categories",
    idC,
    "channels"
  );

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
    async function getChannel() {
      // Channels query
      const qCha = query(channelsCollection);

      onSnapshot(qCha, (querySnapshot) => {
        querySnapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            if (!channels.map((el) => el.id).includes(change.doc.id)) {
              setChannels((channels) =>
                [
                  {
                    id: change.doc.id,
                    createdAt: change.doc.data().createdAt,
                    name: change.doc.data().name,
                  },
                  ...channels.filter((el) => el.id !== change.doc.id),
                ].sort((x, y) => {
                  return new Date(x.createdAt) < new Date(y.createdAt) ? 1 : -1;
                })
              );
            }
          }
          if (change.type === "removed") {
            setChannels((channels) =>
              [...channels.filter((el) => el.id !== change.doc.id)].sort(
                (x, y) => {
                  return new Date(x.createdAt) < new Date(y.createdAt) ? 1 : -1;
                }
              )
            );
          }
        });
      });
    }

    getChannel();
  }, [idC]);

  useEffect(() => {
    if (user.permissions.includes("MANAGE_CHANNELS"))
      setCanManageChannels(true);
    else setCanManageChannels(false);
  }, [user.permissions]);

  const createChannel = async (channelName: string) => {
    setShowPopUp(false);
    await addDoc(channelsCollection, {
      name: channelName.replace(/\s/g, "").length ? channelName : "new-channel",
      createdAt: serverTimestamp(),
    });
  };

  return (
    <div className="navbar_category" id={idC}>
      {showPopUp ? (
        <CreateChannelPopUp
          categoryName={name}
          onConfirm={createChannel}
          onCancel={() => setShowPopUp(false)}
        ></CreateChannelPopUp>
      ) : null}
      <div className={styles.navbar_channels_header}>
        {body}
        {canManageChannels ? (
          <AddIcon
            className={styles.navbar_add_channel}
            onClick={(_) => setShowPopUp(true)}
          />
        ) : null}
      </div>
      <div
        className="navbar_channels"
        style={{
          height: showChannels ? "auto" : "0px",
          visibility: showChannels ? "visible" : "hidden",
        }}
      >
        {channels.map((channel) => (
          <NavbarChannel
            key={channel.id}
            id={channel.id}
            idC={idC}
            name={channel.name}
            nameC={name}
          />
        ))}
      </div>
    </div>
  );
};
