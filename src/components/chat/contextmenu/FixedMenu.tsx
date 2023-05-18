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
  isTop?: boolean;
  isLeft?: boolean;
  className?: string;
  children: ReactNode;
  menuPoint: { x: number; y: number };
  parentRef: RefObject<HTMLDivElement> | RefObject<HTMLSpanElement>;
  onOpen?: () => void;
  onClose?: () => void;
}

export type FixedMenuHandle = {
  isOpen: () => boolean;
  closeMenu: () => void;
  openMenu: (event: React.MouseEvent<HTMLElement>) => void;
  getMenuRef: () => RefObject<HTMLDivElement>;
};

const FixedMenu: React.ForwardRefRenderFunction<
  FixedMenuHandle,
  FixedMenuProps
> = (
  {
    isTop = false,
    isLeft = false,
    children,
    menuPoint,
    parentRef,
    className,
    onOpen,
    onClose,
  },
  ref
) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null); // Ref to main Unordered List element

  const { setCurrentPopUp } = usePopUp();

  useImperativeHandle(ref, () => {
    return {
      isOpen(): boolean {
        return isOpen;
      },

      closeMenu(): void {
        if (onClose) onClose();
        setIsOpen(false);
        setCurrentPopUp(false);
      },

      openMenu(event: React.MouseEvent<HTMLElement>): void {
        event.preventDefault();
        if (onOpen) onOpen();
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
      (e.type == "mousedown" &&
        menuRef.current != null &&
        !menuRef.current!.contains(e.target as Node) &&
        parentRef.current != null &&
        !parentRef.current!.contains(e.target as Node)) ||
      (e.type == "keydown" && (e as KeyboardEvent).key == "Escape") ||
      (e.type == "contextmenu" &&
        menuRef.current != null &&
        !menuRef.current!.contains(e.target as Node) &&
        parentRef.current != null &&
        !parentRef.current!.contains(e.target as Node))
    ) {
      setIsOpen(false);
      setCurrentPopUp(false);
      if (onClose) onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleCloseMenu);
    document.addEventListener("mousedown", handleCloseMenu);
    document.addEventListener("contextmenu", handleCloseMenu);

    return () => {
      document.removeEventListener("keydown", handleCloseMenu);
      document.removeEventListener("mousedown", handleCloseMenu);
      document.removeEventListener("contextmenu", handleCloseMenu);
    };
  }, []);

  return isOpen ? (
    <div
      className={`${styles.menu_element} ${className}`}
      style={
        isTop
          ? isLeft
            ? { top: menuPoint.y, left: menuPoint.x }
            : { top: menuPoint.y, right: menuPoint.x }
          : isLeft
          ? { bottom: menuPoint.y, left: menuPoint.x }
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
