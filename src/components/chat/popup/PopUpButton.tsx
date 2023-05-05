import React, { ReactNode, useState } from "react";
import styles from "../../../styles/components/chat/popups/PopUpButton.module.scss";

export type ButtonColor = "red" | "grey";

export const buttonColors = new Map<ButtonColor, [string, string]>([
  ["red", ["#ff504d", "#e84846"]],
  ["grey", ["#5f6a6e", "#808b90"]],
]);

export interface PopUpButtonProps {
  children: ReactNode;
  color?: [string, string];
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

const PopUpButton: React.FC<PopUpButtonProps> = ({
  children,
  color = ["#5f6a6e", "#808b90"],
  onClick,
}) => {
  const [isHover, setIsHover] = useState(false); // Is user hovering over the button

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      className={styles.popup_button}
      style={{ backgroundColor: isHover ? color[1] : color[0] }}
    >
      {children}
    </button>
  );
};

export default PopUpButton;
