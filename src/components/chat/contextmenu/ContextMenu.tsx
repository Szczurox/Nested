import React, {
  ReactNode,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import styles from "../../../styles/components/chat/contextmenu/ContextMenu.module.scss";

type ContextMenuProps = {
  children: ReactNode;
};

type ContextMenuHandle = {
  closeMenu: () => void;
  handleContextMenu: (event: React.MouseEvent<HTMLElement>) => void;
};

const ContextMenu: React.ForwardRefRenderFunction<
  ContextMenuHandle,
  ContextMenuProps
> = ({ children }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPoint, setMenuPoint] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  useImperativeHandle(ref, () => {
    return {
      closeMenu(): void {
        setIsOpen(false);
      },

      handleContextMenu(event: React.MouseEvent<HTMLElement>): void {
        event.preventDefault();

        setMenuPoint({
          x:
            event.pageX < window.innerWidth - (window.innerWidth / 100) * 10
              ? event.pageX
              : event.pageX - window.innerWidth / 10,
          y:
            event.pageY < window.innerHeight - (window.innerHeight / 100) * 10
              ? event.pageY
              : event.pageY - window.innerHeight / 20,
        });
        setIsOpen(true);
        console.log(isOpen);
      },
    };
  });

  return isOpen ? (
    <ul
      className={styles.contextmenu}
      style={{ top: menuPoint.y, left: menuPoint.x }}
    >
      {children}
    </ul>
  ) : null;
};

export default forwardRef(ContextMenu);
