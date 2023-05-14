import React, { ReactNode, useCallback, useState } from "react";
import styles from "../../../styles/components/chat/popups/PopUpButton.module.scss";

export type ButtonColor = "red" | "grey";

export type ButtonColorType = [string, string, string, string];

// Normal, onHover, onPress, disabled
export const buttonColors = new Map<ButtonColor, ButtonColorType>([
  ["red", ["#ff504d", "#e84846", "#d14341", "#ad3736"]],
  ["grey", ["#5f6a6e", "#808b90", "#6b7478", "#52595c"]],
]);

export interface PopUpButtonProps {
  children: ReactNode;
  color?: ButtonColor;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

const PopUpButton: React.FC<PopUpButtonProps> = ({
  children,
  color = "grey",
  disabled = false,
  onClick,
}) => {
  const [isHover, setIsHover] = useState(false); // Is user hovering over the button
  const [isPressed, setIsPressed] = useState(false); // Is user pressing the button
  const realColor = buttonColors.get(color)!;

  const handleMouseDown = useCallback(() => {
    setIsPressed(true);

    document.addEventListener(
      "mouseup",
      () => {
        setIsPressed(false);
      },
      { once: true }
    );
  }, []);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      onMouseDown={handleMouseDown}
      className={styles.popup_button}
      disabled={disabled}
      style={{
        backgroundColor: disabled
          ? realColor[3]
          : isPressed
          ? realColor[2]
          : isHover
          ? realColor[1]
          : realColor[0],
      }}
    >
      {children}
    </button>
  );
};

export default PopUpButton;
