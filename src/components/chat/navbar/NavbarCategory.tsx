import React, { useEffect, useRef, useState } from "react";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import AddIcon from "@material-ui/icons/Add";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import styles from "../../../styles/components/chat/navbar/NavbarCategory.module.scss";
import { ChannelData, NavbarChannel } from "./NavbarChannel";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import { createFirebaseApp } from "../../../firebase/clientApp";
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useUser } from "context/userContext";
import { useChannel } from "context/channelContext";
import InputPopUp from "../popup/InputPopUp";
import ContextMenuElement from "../contextmenu/ContextMenuElement";
import ContextMenu, { ContextMenuHandle } from "../contextmenu/ContextMenu";
import DeletePopUp from "../popup/DeletePopUp";
import { addChannel } from "components/utils/channelQueries";

export type NavbarCategoryVariant = "server" | "dms";

interface NavbarCategoryProps {
  idC: string;
  variant?: NavbarCategoryVariant;
  name: string;
}

export interface CategoryData {
  id: string;
  name: string;
  createdAt: string;
}

export const NavbarCategory: React.FC<NavbarCategoryProps> = ({
  idC,
  name,
  variant = "server",
}) => {
  const [showChannels, setShowChannels] = useState<boolean>(true);
  const [showPopUp, setShowPopUp] = useState<number>(0);
  const [channels, setChannels] = useState<ChannelData[]>([]);

  const { user } = useUser();
  const { channel } = useChannel();

  const menuRef = useRef<ContextMenuHandle>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  useEffect(() => {
    async function getChannel() {
      const channelsCollection = collection(
        db,
        "groups",
        channel.idG,
        "channels"
      );
      // Channels query
      const qCha = query(channelsCollection, where("categoryId", "==", idC));

      const unsub = onSnapshot(qCha, (querySnapshot) => {
        querySnapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            setChannels((channels) =>
              [
                ...channels.filter((el) => el.id !== change.doc.id),
                {
                  id: change.doc.id,
                  createdAt: change.doc.data().createdAt,
                  name: change.doc.data().name,
                },
              ].sort((x, y) => {
                return x.createdAt > y.createdAt ? 1 : -1;
              })
            );
          }
          if (change.type === "removed") {
            setChannels((channels) =>
              [...channels.filter((el) => el.id !== change.doc.id)].sort(
                (x, y) => {
                  return x.createdAt > y.createdAt ? 1 : -1;
                }
              )
            );
          }
        });
      });

      return unsub;
    }

    getChannel();
  }, [idC]);

  const createChannel = async (channelName: string) => {
    setShowPopUp(0);
    await addChannel(channelName, channel.idG, idC);
  };

  const changeCategoryName = async (newName: string) => {
    if (newName != name && newName.replace(/\s/g, "").length) {
      const categoryDoc = doc(db, "groups", channel.idG, "categories", idC);

      setShowPopUp(0);

      await updateDoc(categoryDoc, {
        name: newName,
      });
    }
  };

  const deleteCategory = async () => {
    setShowPopUp(0);

    // Remove category id from all channels
    channels.forEach(async ({ id }) => {
      const channelDoc = doc(db, "groups", channel.idG, "channels", id);
      await updateDoc(channelDoc, {
        categoryId: "",
      });
    });

    // Delete category
    const categoryDoc = doc(db, "groups", channel.idG, "categories", idC);
    await deleteDoc(categoryDoc);
  };

  return (
    <>
      <ContextMenu ref={menuRef} parentRef={elementRef}>
        {user.permissions.includes("MANAGE_CHANNELS") ? (
          <>
            <ContextMenuElement type={"grey"} onClick={(_) => setShowPopUp(2)}>
              <EditIcon />
              Change Category Name
            </ContextMenuElement>
            <ContextMenuElement type={"red"} onClick={(_) => setShowPopUp(3)}>
              <DeleteIcon />
              Delete Category
            </ContextMenuElement>
          </>
        ) : null}
        <ContextMenuElement
          type={"grey"}
          onClick={(_) => navigator.clipboard.writeText(idC)}
        >
          <ContentCopyIcon />
          Copy Category ID
        </ContextMenuElement>
      </ContextMenu>

      {showPopUp ? (
        showPopUp == 3 ? (
          <DeletePopUp
            onCancel={() => setShowPopUp(0)}
            onConfirm={deleteCategory}
          >
            <h3>Delete Category</h3>
            <p>Are you sure u want to delete {name} category?</p>
          </DeletePopUp>
        ) : (
          <InputPopUp
            onConfirm={showPopUp == 1 ? createChannel : changeCategoryName}
            onCancel={() => setShowPopUp(0)}
            confirmButtonName={showPopUp == 1 ? "Create" : "Confirm"}
            value={showPopUp == 1 ? "" : name}
            placeHolder={showPopUp == 1 ? "new-channel" : name}
            hash={true}
          >
            <h3>
              {showPopUp == 1 ? "Create Channel" : "Change Category Name"}
            </h3>
            {showPopUp == 1 ? (
              <p>Create channel in {name}</p>
            ) : (
              <p>Change name for {name}</p>
            )}
          </InputPopUp>
        )
      ) : null}

      <div className={styles.navbar_category} id={idC}>
        <div
          className={styles.navbar_channels_header}
          onContextMenu={
            menuRef.current! ? menuRef.current!.handleContextMenu : () => null
          }
          ref={elementRef}
        >
          {variant === "server" ? (
            <div
              className={styles.navbar_header}
              onClick={() => setShowChannels(!showChannels)}
            >
              {showChannels ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              <h4>{name}</h4>
            </div>
          ) : (
            <div className={styles.navbar_header}>
              <h4>DIRECT MESSAGES</h4>
            </div>
          )}
          {user.permissions.includes("MANAGE_CHANNELS") ? (
            <AddIcon
              className={styles.navbar_add_channel}
              onClick={(_) => setShowPopUp(1)}
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
    </>
  );
};
