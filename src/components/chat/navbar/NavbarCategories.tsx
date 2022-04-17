import { createFirebaseApp } from "../../../firebase/clientApp";
import {
  collection,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import styles from "../../../styles/components/chat/navbar/NavbarCategories.module.scss";
import { ChannelData, NavbarCategory } from "./NavbarCategory";
import { NavbarChannel } from "./NavbarChannel";

export type NavbarCategoriesVariant = "server" | "dms";

export interface NavbarCategoriesProps {
  variant?: NavbarCategoriesVariant;
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

  useEffect(() => {
    const app = createFirebaseApp();
    const db = getFirestore(app);

    // None category
    async function getNoneChannel() {
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
      onSnapshot(qCha, (querySnapshot) => {
        setNoneCategoryChannels(
          querySnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
          }))
        );
      });
    }

    async function getCategories() {
      // Categories query
      const qCat = query(
        collection(db, "groups", "H8cO2zBjCyJYsmM4g5fv", "categories")
      );
      onSnapshot(qCat, (querySnapshot) => {
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
    }

    getCategories();
    getNoneChannel();
  }, []);

  return (
    <div className={styles.navbar_channels}>
      {variant == "server" ? (
        <>
          {noneCategoryChannels.map(({ id, name }) => (
            <NavbarChannel id={id} name={name} />
          ))}
          {categories.map(({ id, name }) => (
            <NavbarCategory id={id} name={name} />
          ))}
        </>
      ) : (
        <NavbarCategory name="DIRECT MESSAGES" id="1" />
      )}
    </div>
  );
};
