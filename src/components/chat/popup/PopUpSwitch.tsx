import React, { ReactNode, useCallback, useRef, useState } from "react";
import styles from "../../../styles/components/chat/popups/PopUpSwitch.module.scss";
import { ButtonColor, buttonColors } from "./PopUpButton";

export interface PopUpSwitchProps {
  offColor?: ButtonColor;
  onColor?: ButtonColor;
  onChange: (isOn: boolean) => void;
}

const PopUpSwitch: React.FC<PopUpSwitchProps> = ({
  offColor = "grey",
  onColor = "grey",
  onChange,
}) => {
  const [isHover, setIsHover] = useState(false); // Is user hovering over the switch
  const [isPressed, setIsPressed] = useState(false); // Is user pressing the switch
  const [isOn, setIsOn] = useState(false); // Is the switch on
  const realOffColor = buttonColors.get(offColor)!;
  const realOnColor = buttonColors.get(onColor)!;

  const sliderRef = useRef<HTMLSpanElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
    setIsOn(e.target.checked);
  };

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
    <label className={styles.switch}>
      <input type="checkbox" onChange={(e) => handleChange(e)} />
      <span
        className={styles.slider}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        onMouseDown={handleMouseDown}
        style={{
          backgroundColor: isOn
            ? isHover
              ? isPressed
                ? realOnColor[1]
                : realOnColor[2]
              : realOnColor[0]
            : isHover
            ? isPressed
              ? realOffColor[1]
              : realOnColor[2]
            : realOffColor[0],
        }}
        ref={sliderRef}
      />
    </label>
  );
};

export default PopUpSwitch;
