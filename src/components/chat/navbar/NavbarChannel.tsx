import { useChannel } from "context/channelContext";
import React, { useEffect, useRef, useState } from "react";
import styles from "../../../styles/components/chat/navbar/NavbarChannel.module.scss";
import ContextMenu, { ContextMenuHandle } from "../contextmenu/ContextMenu";
import ContextMenuElement from "../contextmenu/ContextMenuElement";
import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { createFirebaseApp } from "../../../firebase/clientApp";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import CircleIcon from "@mui/icons-material/Circle";
import InputPopUp from "../popup/InputPopUp";
import BasicDeletePopUp from "../popup/DeletePopUp";
import { addChannel } from "components/utils/channelQueries";
import { useUser } from "context/userContext";

interface NavbarChannelProps {
  name: string;
  id: string;
  idC: string;
  nameC?: string;
  lastMessageAt?: number;
}

export interface ChannelData {
  id: string;
  name: string;
  createdAt: string;
  lastMessageAt: number;
}

export const NavbarChannel: React.FC<NavbarChannelProps> = ({
  name,
  id,
  idC,
  nameC = "",
  lastMessageAt,
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isUnread, setIsUnread] = useState<boolean>(false);
  // 0 - None  /  1 - Delete  /  2 - Change Name  /  3 - Create
  const [showPopUp, setShowPopUp] = useState<number>(0);

  const { channel, setChannelData } = useChannel();
  const { user } = useUser();

  const menuRef = useRef<ContextMenuHandle>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  const partRef = doc(
    db,
    "groups",
    channel.idG,
    "channels",
    id,
    "participants",
    user.uid
  );

  useEffect(() => {
    if (channel.id == id) setIsActive(true);
    else setIsActive(false);
  }, [channel.id, id]);

  useEffect(() => {
    const participantSnapshot = () => {
      return onSnapshot(partRef, (doc) => {
        if (doc.exists() && doc.data()!.lastActive != null) {
          if (doc.data()!.lastActive < lastMessageAt!) setIsUnread(true);
          else setIsUnread(false);
        }
      });
    };

    async function checkParticipant() {
      const participantDoc = await getDoc(partRef);
      if (lastMessageAt) {
        if (participantDoc.exists()) {
          return participantSnapshot();
        } else {
          await setDoc(partRef, { lastActive: serverTimestamp() });
          return participantSnapshot();
        }
      } else return () => undefined;
    }

    // Set channel ID to the first loaded channel
    if (channel.id == "") setChannelData(id, name, idC, nameC);

    checkParticipant().then((res) => {
      return () => res();
    });
  }, []);

  const updateLastActive = async () => {
    await setDoc(
      doc(db, "groups", channel.idG, "channels", id, "participants", user.uid),
      { lastActive: serverTimestamp() }
    );
  };

  const handleToggle = () => {
    updateLastActive();
    setIsActive(true);
    setChannelData(id, name, idC, nameC);
  };

  const deleteChannel = async () => {
    // It won't actually delete the channel, it's subcollections (messages) will still exist
    // Because of that for now inactive channels will need to get deleted manually using the CLI or console
    // TODO: Server side function for deleting all channel's messages (performance issues if on client) (maybe Cron Job?)
    const channelDoc = doc(db, "groups", channel.idG, "channels", id);

    setShowPopUp(0);

    // Kick user out of the channel so that messages can't be seen anymore
    if (channel.id == id) setChannelData("", "", "", "");

    await deleteDoc(channelDoc);
  };

  const changeChannelName = async (newName: string) => {
    if (newName != name && newName.replace(/\s/g, "").length) {
      const channelDoc = doc(db, "groups", channel.idG, "channels", id);

      setShowPopUp(0);

      await updateDoc(channelDoc, {
        name: newName,
      });
    }
  };

  const createChannel = async (channelName: string) => {
    setShowPopUp(0);
    await addChannel(channelName, channel.idG, idC);
  };

  return (
    <>
      {showPopUp ? (
        showPopUp == 1 ? (
          <BasicDeletePopUp
            onCancel={() => setShowPopUp(0)}
            onConfirm={deleteChannel}
          >
            <h3>Delete Channel</h3>
            <p>Are you sure u want to delete #{name} channel?</p>
          </BasicDeletePopUp>
        ) : (
          <InputPopUp
            onConfirm={showPopUp == 3 ? createChannel : changeChannelName}
            onCancel={() => setShowPopUp(0)}
            confirmButtonName={showPopUp == 3 ? "Create" : "Confirm"}
            value={showPopUp == 3 ? "" : name}
            placeHolder={showPopUp == 3 ? "new-channel" : name}
            hash={true}
          >
            <h3>{showPopUp == 3 ? "Create Channel" : "Change Channel Name"}</h3>
            {showPopUp == 3 ? (
              <p>Create channel in {nameC}</p>
            ) : (
              <p>Change name for #{name}</p>
            )}
          </InputPopUp>
        )
      ) : null}

      <ContextMenu ref={menuRef} parentRef={elementRef}>
        <ContextMenuElement type={"grey"} onClick={(_) => updateLastActive()}>
          <VisibilityIcon />
          Mark As Read
        </ContextMenuElement>
        {user.permissions.includes("MANAGE_CHANNELS") ? (
          <>
            <ContextMenuElement type={"grey"} onClick={(_) => setShowPopUp(2)}>
              <EditIcon />
              Change Channel Name
            </ContextMenuElement>
            <ContextMenuElement type={"grey"} onClick={(_) => setShowPopUp(3)}>
              <AddIcon />
              Create Channel
            </ContextMenuElement>
            <ContextMenuElement type={"red"} onClick={(_) => setShowPopUp(1)}>
              <DeleteIcon />
              Delete Channel
            </ContextMenuElement>
          </>
        ) : null}
        <ContextMenuElement
          type={"grey"}
          onClick={(_) => navigator.clipboard.writeText(id)}
        >
          <ContentCopyIcon />
          Copy Channel ID
        </ContextMenuElement>
      </ContextMenu>

      <div
        className={
          isActive
            ? `${styles.channel} ${styles.active}`
            : isUnread
            ? `${styles.channel} ${styles.unread}`
            : `${styles.channel} ${styles.inactive}`
        }
        id={id}
        onClick={handleToggle}
        onContextMenu={(e) => menuRef.current?.handleContextMenu(e)}
        ref={elementRef}
      >
        <h4>
          {isUnread && <CircleIcon className={styles.unread_dot} />}
          <span className={styles.hash}>#</span>
          <div className={styles.channel_name}>{name}</div>
        </h4>
      </div>
    </>
  );
};
