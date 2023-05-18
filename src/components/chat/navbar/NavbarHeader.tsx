import React, { useRef } from "react";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import styles from "../../../styles/components/chat/navbar/NavbarHeader.module.scss";
import FixedMenu, { FixedMenuHandle } from "../contextmenu/FixedMenu";
import ContextMenuElement from "../contextmenu/ContextMenuElement";

export type NavbarHeaderVariant = "server" | "dms";

interface NavbarHeaderProps {
  variant?: NavbarHeaderVariant;
}

export const NavbarHeader: React.FC<NavbarHeaderProps> = ({
  variant = "server",
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<FixedMenuHandle>(null);

  let body = null;

  if (variant === "server") {
    body = (
      <p onClick={menuRef.current ? menuRef.current.openMenu : () => null}>
        <FixedMenu
          menuPoint={{ x: 10, y: 10 }}
          isTop={true}
          parentRef={elementRef}
          ref={menuRef}
        >
          <p>hi</p>
        </FixedMenu>
        <h4>Text Channels</h4>
        <ExpandMoreIcon />
      </p>
    );
  }

  return variant === "server" ? (
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
        menuPoint={{ x: 36, y: 80 }}
        parentRef={elementRef}
        ref={menuRef}
        isTop={true}
        isLeft={true}
      >
        <ContextMenuElement>hi</ContextMenuElement>
      </FixedMenu>
      <h4>Text Channels</h4>
      <ExpandMoreIcon />
    </div>
  ) : (
    <div className="search">
      <input placeholder="Search" />
    </div>
  );
};
