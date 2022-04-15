import React, { useCallback, useEffect, useState } from "react";
import styles from "../../../styles/components/chat/ContextMenu.module.scss";

export type ContextMenuElement = { string: string };

interface ContextMenu {
  content: ContextMenuElement;
  xPos: string;
  yPos: string;
}

export const ContextMenu: React.FC<ContextMenu> = ({ content, xPos, yPos }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleClick = useCallback(
    (e) => {
      if (showMenu) setShowMenu(false);
    },
    [showMenu]
  );

  const keyPress = useCallback(
    (e: any) => {
      if (e.keyCode === 27) {
        setShowMenu(false);
      }
    },
    [showMenu]
  );

  useEffect(() => {
    document.addEventListener("keydown", keyPress);
    document.addEventListener("contextmenu", handleClick);
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("keydown", keyPress);
      document.removeEventListener("contextmenu", handleClick);
      document.removeEventListener("click", handleClick);
    };
  });

  return (
    <div>
      {showMenu ? (
        <ul className={styles.contextmenu} style={{ top: yPos, left: xPos }}>
          <li>Create Channel</li>
          <li>Create Category</li>
        </ul>
      ) : null}
    </div>
  );
};
