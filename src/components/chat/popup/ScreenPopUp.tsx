import React, { ReactNode, useEffect } from "react";
import styles from "../../../styles/components/chat/popups/ScreenPopUp.module.scss";
import { usePopUp } from "context/popUpContext";

interface PopUpProps {
	children: ReactNode;
	full?: boolean;
}

const ScreenPopUp: React.FC<PopUpProps> = ({ children, full }) => {
	const { setCurrentPopUp } = usePopUp();

	useEffect(() => {
		setCurrentPopUp(true);
		return () => {
			setCurrentPopUp(false);
		};
	}, []);

	return (
		<div className={styles.screen_popup}>
			{full ? (
				children
			) : (
				<div className={styles.screen_popup_box}>{children}</div>
			)}
		</div>
	);
};

export default ScreenPopUp;
