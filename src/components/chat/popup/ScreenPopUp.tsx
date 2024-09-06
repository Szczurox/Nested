import React, { ReactNode, useEffect } from "react";
import styles from "../../../styles/components/chat/popups/ScreenPopUp.module.scss";
import { usePopUp } from "context/popUpContext";

const ScreenPopUp: React.FC<{ children: ReactNode }> = ({ children }) => {
	const { setCurrentPopUp } = usePopUp();

	useEffect(() => {
		setCurrentPopUp(true);
		return () => setCurrentPopUp(false);
	}, []);

	return (
		<div className={styles.screen_popup}>
			<div className={styles.screen_popup_box}>{children}</div>
		</div>
	);
};

export default ScreenPopUp;
