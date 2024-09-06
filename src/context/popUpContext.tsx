import { useState, createContext, useContext } from "react";

export interface PopUpContextType {
	popUp: {
		isOpen: boolean;
	};
	setCurrentPopUp: (isOpen: boolean) => void;
}

export const PopUpContext = createContext<PopUpContextType>({
	popUp: { isOpen: false },
	setCurrentPopUp: (_isOpen: boolean) => undefined,
});

export default function PopUpContextComp({ children }: any) {
	const [popUp, setPopUp] = useState({ isOpen: false });

	const setCurrentPopUp = (isOpen: boolean) => {
		setPopUp({ isOpen: isOpen });
	};

	return (
		<PopUpContext.Provider value={{ popUp, setCurrentPopUp }}>
			{children}
		</PopUpContext.Provider>
	);
}

export const usePopUp = () => useContext(PopUpContext);
