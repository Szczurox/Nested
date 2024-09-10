import React, { ReactNode, useEffect } from "react";
import styles from "../../../styles/components/chat/popups/ScreenPopUp.module.scss";
import { usePopUp } from "context/popUpContext";

interface PopUpProps {
	children: ReactNode;
	full?: boolean;
}

const ScreenPopUp: React.FC<PopUpProps> = ({ children, full = false }) => {
	const { setCurrentPopUp } = usePopUp();

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => {
		setCurrentPopUp(true);
		return () => setCurrentPopUp(false);
	}, [setCurrentPopUp]);

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
