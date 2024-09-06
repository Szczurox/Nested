import React, { ReactNode, useCallback, useState } from "react";
import styles from "../../../styles/components/chat/contextmenu/ContextMenuElement.module.scss";
import {
	ButtonColor,
	ButtonColorType,
	buttonColors,
} from "../popup/PopUpButton";

interface ContextMenuElementProps {
	children: ReactNode;
	type?: ButtonColor;
	onClick?: (e: React.MouseEvent<HTMLElement>) => void;
	colors?: ButtonColorType;
}

const ContextMenuElement: React.FC<ContextMenuElementProps> = ({
	children,
	type = "grey",
	onClick,
	colors = buttonColors.get(type)!,
}) => {
	const [isHover, setIsHover] = useState(false); // Is user hovering over the button
	const [isPressed, setIsPressed] = useState(false); // Is user pressing the button

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
		<li
			className={`${styles.contextmenu_element} ${
				type == "grey" ? styles.normal : styles.red
			}`}
			onClick={onClick}
			onMouseEnter={() => setIsHover(true)}
			onMouseLeave={() => setIsHover(false)}
			onMouseDown={handleMouseDown}
			style={{
				backgroundColor: isPressed
					? colors[2]
					: isHover
					? colors[1]
					: "",
				color:
					!isHover && !isPressed && type == "red"
						? colors[0]
						: "white",
			}}
		>
			{children}
		</li>
	);
};

export default ContextMenuElement;
