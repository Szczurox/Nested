import React, { ReactNode, useCallback, useRef, useState } from "react";
import styles from "../../../styles/components/chat/popups/PopUpSwitch.module.scss";
import { ButtonColor, buttonColors } from "./PopUpButton";

export interface PopUpSwitchProps {
	offColor?: ButtonColor;
	onColor?: ButtonColor;
	onChange: (isOn: boolean) => void;
	disabled?: boolean;
}

const PopUpSwitch: React.FC<PopUpSwitchProps> = ({
	offColor = "grey",
	onColor = "grey",
	onChange,
	disabled,
}) => {
	const [isHover, setIsHover] = useState(false); // Is user hovering over the switch
	const [isPressed, setIsPressed] = useState(false); // Is user pressing the switch
	const [isOn, setIsOn] = useState(false); // Is the switch on
	const realOffColor = buttonColors.get(offColor)!;
	const realOnColor = buttonColors.get(onColor)!;

	const sliderRef = useRef<HTMLSpanElement>(null);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!disabled) {
			onChange(e.target.checked);
			setIsOn(e.target.checked);
		} else {
			setIsOn(false);
		}
	};

	const handleMouseDown = useCallback(() => {
		if (!disabled) {
			setIsPressed(true);

			document.addEventListener(
				"mouseup",
				() => {
					setIsPressed(false);
				},
				{ once: true }
			);
		}
	}, [disabled]);

	return (
		<label
			className={styles.switch}
			style={disabled ? { cursor: "not-allowed" } : {}}
		>
			<input
				disabled={disabled}
				type="checkbox"
				onChange={(e) => handleChange(e)}
				style={disabled ? { cursor: "not-allowed" } : {}}
			/>
			<span
				className={styles.slider}
				onMouseEnter={() => (!disabled ? setIsHover(true) : null)}
				onMouseLeave={() => (!disabled ? setIsHover(false) : null)}
				onMouseDown={handleMouseDown}
				style={{
					cursor: disabled ? "not-allowed" : "pointer",
					backgroundColor: !disabled
						? isOn
							? isHover
								? isPressed
									? realOnColor[1]
									: realOnColor[2]
								: realOnColor[0]
							: isHover
							? isPressed
								? realOffColor[1]
								: realOnColor[2]
							: realOffColor[0]
						: realOnColor[3],
				}}
				ref={sliderRef}
			/>
		</label>
	);
};

export default PopUpSwitch;
