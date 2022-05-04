import React, { useEffect, useState } from "react";
import styles from "../../../styles/components/chat/navbar/NavbarCategories.module.scss";
import { NavbarCategory } from "./NavbarCategory";
import { NavbarChannel } from "./NavbarChannel";
import {
  query,
  collection,
  onSnapshot,
  getFirestore,
} from "firebase/firestore";
import { createFirebaseApp } from "../../../firebase/clientApp";

export type NavbarCategoriesVariant = "server" | "dms";

export interface NavbarCategoriesProps {
  variant?: NavbarCategoriesVariant;
}

export interface ChannelData {
  id: string;
  name: string;
}

export interface CategoryData {
  id: string;
  name: string;
}

export const NavbarCategories: React.FC<NavbarCategoriesProps> = ({
  variant = "server",
}) => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [noneCategoryChannels, setNoneCategoryChannels] = useState<
    ChannelData[]
  >([]);

  const app = createFirebaseApp();
  const db = getFirestore(app);

  useEffect(() => {
    function categoriesGet() {
      // Categories query
      const qCat = query(
        collection(db, "groups", "H8cO2zBjCyJYsmM4g5fv", "categories")
      );

      const unsub = onSnapshot(qCat, (querySnapshot) => {
        setCategories(
          // Filtering categories so that "none" category is handled differently
          querySnapshot.docs.reduce(function (filtered: CategoryData[], doc) {
            if (doc.id != "none") {
              return filtered.concat({
                id: doc.id,
                name: doc.data().name,
              });
            }
            return filtered;
          }, [])
        );
      });

      return unsub;
    }

    // None category
    async function getChannel() {
      // Channels query
      const qCha = query(
        collection(
          db,
          "groups",
          "H8cO2zBjCyJYsmM4g5fv",
          "categories",
          "none",
          "channels"
        )
      );
      const unsub = onSnapshot(qCha, (querySnapshot) => {
        setNoneCategoryChannels(
          querySnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
          }))
        );
      });

      return unsub;
    }

    categoriesGet();
    getChannel();
  }, [db]);

  return (
    <div className={styles.navbar_channels}>
      {variant == "server" ? (
        <>
          {noneCategoryChannels.map(({ id, name }) => (
            <NavbarChannel key={id} id={id} idC="none" name={name} />
          ))}
          {categories.map(({ id, name }) => (
            <NavbarCategory key={id} idC={id} name={name} />
          ))}
        </>
      ) : (
        <NavbarCategory name="DIRECT MESSAGES" idC="1" />
      )}
    </div>
  );
};
