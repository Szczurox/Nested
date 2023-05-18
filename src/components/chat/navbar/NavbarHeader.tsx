import React, { useEffect, useRef, useState } from "react";
import styles from "../../../styles/components/chat/navbar/NavbarHeader.module.scss";
import FixedMenu, { FixedMenuHandle } from "../contextmenu/FixedMenu";
import ContextMenuElement from "../contextmenu/ContextMenuElement";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import EditIcon from "@material-ui/icons/Edit";
import { useChannel } from "context/channelContext";
import InputPopUp from "../popup/InputPopUp";
import { useUser } from "context/userContext";
import { createFirebaseApp } from "../../../firebase/clientApp";
import { doc, getFirestore, updateDoc } from "firebase/firestore";

export type NavbarHeaderVariant = "server" | "dms";

interface NavbarHeaderProps {
  variant?: NavbarHeaderVariant;
}

export const NavbarHeader: React.FC<NavbarHeaderProps> = ({
  variant = "server",
}) => {
  const [showPopUp, setShowPopUp] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const elementRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<FixedMenuHandle>(null);

  const { channel } = useChannel();
  const { user } = useUser();

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  const changeName = async (newName: string) => {
    setShowPopUp(false);

    const memberDoc = doc(db, "groups", channel.idG, "members", user.uid);

    if (newName.replace(/\s/g, "").length)
      await updateDoc(memberDoc, {
        nickname: newName,
      });
  };

  useEffect(() => {}, [menuRef.current]);

  return variant === "server" ? (
    <>
      {showPopUp && (
        <InputPopUp
          onConfirm={changeName}
          onCancel={() => setShowPopUp(false)}
          confirmButtonName={"Confirm"}
          value={user.nickname}
          placeHolder={user.nickname}
        >
          <h3>{"Change Group Nickname"}</h3>
          <p>Change nickname on this group</p>
        </InputPopUp>
      )}

      <div
        className={styles.sidebar_header}
        onClick={(e) =>
          menuRef.current
            ? !menuRef.current.isOpen()
              ? menuRef.current!.openMenu(e)
              : menuRef.current.closeMenu()
            : null
        }
        ref={elementRef}
      >
        <FixedMenu
          menuPoint={{ x: 18, y: 80 }}
          parentRef={elementRef}
          ref={menuRef}
          isTop={true}
          isLeft={true}
          className={styles.header_menu}
          onOpen={() => setShowMenu(true)}
          onClose={() => setShowMenu(false)}
        >
          <ContextMenuElement type={"grey"} onClick={(_) => setShowPopUp(true)}>
            <EditIcon />
            Change Nickname
          </ContextMenuElement>
          <ContextMenuElement
            type={"grey"}
            onClick={(_) => navigator.clipboard.writeText(channel.idG)}
          >
            <ContentCopyIcon />
            Copy Group ID
          </ContextMenuElement>
        </FixedMenu>
        <h4>Text Channels</h4>
        {showMenu ? <ExpandMoreIcon /> : <ExpandLessIcon />}
      </div>
    </>
  ) : (
    <div className="search">
      <input placeholder="Search" />
    </div>
  );
};
