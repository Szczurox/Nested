import React, { useEffect, useRef, useState } from "react";
import styles from "../../../styles/components/chat/navbar/NavbarCategories.module.scss";
import { CategoryData, NavbarCategory } from "./NavbarCategory";
import { ChannelData, NavbarChannel } from "./NavbarChannel";
import {
  query,
  collection,
  onSnapshot,
  getFirestore,
  where,
} from "firebase/firestore";
import { createFirebaseApp } from "../../../firebase-utils/clientApp";
import { useChannel } from "context/channelContext";
import ContextMenu, { ContextMenuHandle } from "../contextmenu/ContextMenu";
import ContextMenuElement from "../contextmenu/ContextMenuElement";
import AddIcon from "@material-ui/icons/Add";
import { useUser } from "context/userContext";
import InputPopUp from "../popup/InputPopUp";
import { addCategory } from "components/utils/categoryQueries";
import { addChannel } from "components/utils/channelQueries";

export type NavbarCategoriesVariant = "server" | "dms";

export interface NavbarCategoriesProps {
  variant?: NavbarCategoriesVariant;
}

export const NavbarCategories: React.FC<NavbarCategoriesProps> = ({
  variant = "server",
}) => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  // Channels with category None
  const [nCategoryChannels, setNCategoryChannels] = useState<ChannelData[]>([]);
  const [showPopUp, setShowPopUp] = useState<number>(0);

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  const { channel } = useChannel();
  const { user } = useUser();

  const menuRef = useRef<ContextMenuHandle>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function categoriesGet() {
      // Categories query
      const qCat = query(collection(db, "groups", channel.idG, "categories"));

      const unsub = onSnapshot(qCat, (querySnapshot) => {
        querySnapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            setCategories((channels) =>
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
            setCategories((channels) =>
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

    // None category
    async function getChannel() {
      // Channels query
      const qCha = query(
        collection(db, "groups", channel.idG, "channels"),
        where("categoryId", "==", "")
      );

      const unsub = onSnapshot(qCha, (querySnapshot) => {
        querySnapshot.docChanges().forEach((change) => {
          if (change.type === "removed" || change.type == "modified") {
            setNCategoryChannels((channels) =>
              [...channels.filter((el) => el.id !== change.doc.id)].sort(
                (x, y) => {
                  return x.createdAt > y.createdAt ? 1 : -1;
                }
              )
            );
          }
          if (change.type === "added" || change.type === "modified") {
            setNCategoryChannels((channels) =>
              [
                ...channels.filter((el) => el.id !== change.doc.id),
                {
                  id: change.doc.id,
                  createdAt: change.doc.data().createdAt,
                  name: change.doc.data().name,
                  lastMessageAt: change.doc.data().lastMessageAt,
                },
              ].sort((x, y) => {
                return x.createdAt > y.createdAt ? 1 : -1;
              })
            );
          }
        });
      });

      return unsub;
    }

    categoriesGet();
    getChannel();
  }, [db, channel.idG]);

  const createCategory = (name: string) => {
    setShowPopUp(0);
    addCategory(name, channel.idG);
  };

  const createChannel = (name: string) => {
    setShowPopUp(0);
    addChannel(name, channel.idG);
  };

  return (
    <>
      {user.permissions.includes("MANAGE_CHANNELS") && (
        <ContextMenu ref={menuRef} parentRef={elementRef}>
          <ContextMenuElement type={"grey"} onClick={(_) => setShowPopUp(1)}>
            <AddIcon />
            Add Channel
          </ContextMenuElement>
          <ContextMenuElement type={"grey"} onClick={(_) => setShowPopUp(2)}>
            <AddIcon />
            Add Category
          </ContextMenuElement>
        </ContextMenu>
      )}

      {showPopUp ? (
        <InputPopUp
          onConfirm={showPopUp == 1 ? createChannel : createCategory}
          onCancel={() => setShowPopUp(0)}
          confirmButtonName={"Create"}
          placeHolder={showPopUp == 1 ? "new-channel" : ""}
          hash={showPopUp == 1}
        >
          <h3>{showPopUp == 1 ? "Create Channel" : "Create Category"}</h3>
          {showPopUp == 1 ? (
            <p>Create a channel without category</p>
          ) : (
            <p>Create a category</p>
          )}
        </InputPopUp>
      ) : null}

      <div
        className={styles.navbar_channels}
        ref={elementRef}
        onContextMenu={
          menuRef.current
            ? menuRef.current!.handleContextMenu
            : (e) => e.preventDefault()
        }
      >
        {variant == "server" ? (
          <>
            {nCategoryChannels.map(({ id, name, lastMessageAt }) => (
              <NavbarChannel
                key={id}
                id={id}
                idC="none"
                name={name}
                lastMessageAt={lastMessageAt}
              />
            ))}
            {categories.map(({ id, name }) => (
              <NavbarCategory key={id} idC={id} name={name} />
            ))}
          </>
        ) : (
          <NavbarCategory name="DIRECT MESSAGES" idC="" />
        )}
      </div>
    </>
  );
};
