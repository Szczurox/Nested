import React, {
  ReactNode,
  RefObject,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import styles from "../../../styles/components/chat/contextmenu/FixedMenu.module.scss";
import { usePopUp } from "context/popUpContext";

interface FixedMenuProps {
  children: ReactNode;
  isTop?: boolean;
  menuPoint: { x: number; y: number };
}

export type FixedMenuHandle = {
  closeMenu: () => void;
  openMenu: (event: React.MouseEvent<HTMLElement>) => void;
  getMenuRef: () => RefObject<HTMLDivElement>;
};

const FixedMenu: React.ForwardRefRenderFunction<
  FixedMenuHandle,
  FixedMenuProps
> = ({ children, isTop = false, menuPoint }, ref) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null); // Ref to main Unordered List element

  const { setCurrentPopUp } = usePopUp();

  useImperativeHandle(ref, () => {
    return {
      closeMenu(): void {
        setIsOpen(false);
        setCurrentPopUp(false);
      },

      openMenu(event: React.MouseEvent<HTMLElement>): void {
        event.preventDefault();
        console.log("open??");
        setIsOpen(true);
        setCurrentPopUp(true);
      },

      getMenuRef(): RefObject<HTMLDivElement> {
        return menuRef;
      },
    };
  });

  const handleCloseMenu = (e: Event): void => {
    if (
      (e.type == "click" &&
        menuRef.current != null &&
        !menuRef.current!.contains(e.target as Node) &&
        !(e as KeyboardEvent).shiftKey) ||
      (e.type == "keydown" && (e as KeyboardEvent).key == "Escape") ||
      (e.type == "contextmenu" &&
        menuRef.current != null &&
        !menuRef.current!.contains(e.target as Node))
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleCloseMenu);
    document.addEventListener("click", handleCloseMenu);
    document.addEventListener("contextmenu", handleCloseMenu);

    return () => {
      document.removeEventListener("keydown", handleCloseMenu);
      document.removeEventListener("click", handleCloseMenu);
      document.removeEventListener("contextmenu", handleCloseMenu);
    };
  }, []);

  return isOpen ? (
    <div
      className={styles.menu_element}
      style={
        isTop
          ? { top: menuPoint.y, right: menuPoint.x }
          : { bottom: menuPoint.y, right: menuPoint.x }
      }
      onContextMenu={(e) => e.preventDefault()}
      ref={menuRef}
    >
      {children}
    </div>
  ) : null;
};

export default forwardRef(FixedMenu);
