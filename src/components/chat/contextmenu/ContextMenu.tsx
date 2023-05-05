import React, {
  ReactNode,
  RefObject,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import styles from "../../../styles/components/chat/contextmenu/ContextMenu.module.scss";

type ContextMenuProps = {
  children: ReactNode;
};

type ContextMenuHandle = {
  closeMenu: () => void;
  handleContextMenu: (event: React.MouseEvent<HTMLElement>) => void;
  getListRef: () => RefObject<HTMLUListElement>;
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

  const listRef = useRef<HTMLUListElement>(null); // Ref to main Unordered List element

  useImperativeHandle(ref, () => {
    return {
      closeMenu(): void {
        setIsOpen(false);
      },

      handleContextMenu(event: React.MouseEvent<HTMLElement>): void {
        event.preventDefault();

        setMenuPoint({
          x:
            event.pageX < window.innerWidth - (window.innerWidth / 100) * 20
              ? event.pageX
              : event.pageX - window.innerWidth / 5,
          y:
            event.pageY < window.innerHeight - (window.innerHeight / 100) * 20
              ? event.pageY
              : event.pageY - window.innerHeight / 10,
        });
        setIsOpen(true);
      },

      getListRef(): RefObject<HTMLUListElement> {
        return listRef;
      },
    };
  });

  return isOpen ? (
    <ul
      className={styles.contextmenu}
      style={{ top: menuPoint.y, left: menuPoint.x }}
      onContextMenu={(e) => e.preventDefault()}
      ref={listRef}
    >
      {children}
    </ul>
  ) : null;
};

export default forwardRef(ContextMenu);
