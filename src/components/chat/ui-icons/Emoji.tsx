import React, { useEffect, useRef } from "react";
import styles from "../../../styles/components/chat/ui-icons/Emoji.module.scss";
import EmojiEmotionsIcon from "@material-ui/icons/EmojiEmotions";
import FixedMenu, { FixedMenuHandle } from "../contextmenu/FixedMenu";

const Emoji: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const menuRef = useRef<FixedMenuHandle>(null);
  const elementRef = useRef<HTMLSpanElement>(null);

  return (
    <>
      <FixedMenu
        menuPoint={{ x: 20, y: 100 }}
        ref={menuRef}
        parentRef={elementRef}
      >
        <div className={styles.emoji_header}>Emoji</div>
      </FixedMenu>
      <span
        onClick={
          menuRef.current && enabled ? menuRef.current.openMenu : () => null
        }
        ref={elementRef}
      >
        <EmojiEmotionsIcon fontSize="large" />
      </span>
    </>
  );
};

export default Emoji;
