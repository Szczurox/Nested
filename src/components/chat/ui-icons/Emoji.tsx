import React, { useEffect, useRef } from "react";
import styles from "../../../styles/components/chat/ui-icons/Emoji.module.scss";
import { usePopUp } from "context/popUpContext";
import EmojiEmotionsIcon from "@material-ui/icons/EmojiEmotions";
import FixedMenu, { FixedMenuHandle } from "../contextmenu/FixedMenu";

const Emoji: React.FC<{}> = ({}) => {
  const menuRef = useRef<FixedMenuHandle>(null);

  return (
    <>
      <FixedMenu menuPoint={{ x: 20, y: 100 }} ref={menuRef}>
        <div>hi lol</div>
      </FixedMenu>
      <span onClick={menuRef.current ? menuRef.current.openMenu : () => null}>
        <EmojiEmotionsIcon fontSize="large" />
      </span>
    </>
  );
};

export default Emoji;
