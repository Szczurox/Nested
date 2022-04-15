import React from "react";
import styles from "../../../styles/components/chat/navbar/NavbarCategories.module.scss";
import { NavbarCategory } from "./NavbarCategory";

export type NavbarCategoriesVariant = "server" | "dms";

interface NavbarCategoriesProps {
  variant?: NavbarCategoriesVariant;
}

export const NavbarCategories: React.FC<NavbarCategoriesProps> = ({
  variant = "server",
}) => {
  return (
    <div className={styles.navbar_channels}>
      <NavbarCategory name="dupa123" />
    </div>
  );
};
