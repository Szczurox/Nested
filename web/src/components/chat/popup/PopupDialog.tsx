import React, { ReactNode, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogProps,
} from "@mui/material";
import { usePopUp } from "@/context/popUpContext";

interface PopupDialogProps extends Pick<DialogProps, "open" | "onClose"> {
	children: ReactNode;
}

const PopupDialog: React.FC<PopupDialogProps> = ({
	children,
	open,
	onClose,
}) => {
	const { setCurrentPopUp } = usePopUp();

	useEffect(() => {
		setCurrentPopUp(open);
		return () => setCurrentPopUp(false);
	}, [open, setCurrentPopUp]);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullWidth
			maxWidth="xs"
			slotProps={{
				paper: {
					sx: {
						backgroundColor: "#363a3f",
						color: "white",
						borderRadius: 2,
					},
				},
			}}
		>
			<DialogContent sx={{ padding: 3 }}>{children}</DialogContent>
		</Dialog>
	);
};

export default PopupDialog;
