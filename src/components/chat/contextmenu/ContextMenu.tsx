import React, {
	ReactNode,
	RefObject,
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import styles from "../../../styles/components/chat/contextmenu/ContextMenu.module.scss";
import { useMediaQuery } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface ContextMenuProps {
	children: ReactNode;
	parentRef: RefObject<HTMLDivElement> | RefObject<HTMLSpanElement>;
}

export type ContextMenuHandle = {
	closeMenu: () => void;
	handleContextMenu: (event: React.MouseEvent<HTMLElement>) => void;
	getListRef: () => RefObject<HTMLUListElement>;
};

const ContextMenu: React.ForwardRefRenderFunction<
	ContextMenuHandle,
	ContextMenuProps
> = ({ children, parentRef }, ref) => {
	const isMobile = useMediaQuery("(pointer: none), (pointer: coarse)");

	const [isOpen, setIsOpen] = useState(false);
	const [menuPoint, setMenuPoint] = useState<{ x: number; y: number }>({
		x: 0,
		y: 0,
	});

	const listRef = useRef<HTMLUListElement>(null); // Ref to main Unordered List element

	useImperativeHandle(ref, () => {
		return {
			closeMenu(): void {
				setIsOpen(false);
			},

			handleContextMenu(event: React.MouseEvent<HTMLElement>): void {
				event.preventDefault();

				if (!isMobile)
					setMenuPoint({
						x:
							event.pageX <
							window.innerWidth - (window.innerWidth / 100) * 20
								? event.pageX
								: event.pageX - window.innerWidth / 5,
						y:
							event.pageY <
							window.innerHeight - (window.innerHeight / 100) * 20
								? event.pageY
								: event.pageY - window.innerHeight / 10,
					});

				setIsOpen(true);
			},

			getListRef(): RefObject<HTMLUListElement> {
				return listRef;
			},
		};
	});

	useEffect(() => {
		const handleCloseMenu = (e: Event): void => {
			if (
				e.type == "click" ||
				(e.type == "keydown" && (e as KeyboardEvent).key == "Escape") ||
				(e.type == "contextmenu" &&
					!parentRef.current?.contains(e.target as Node) &&
					listRef.current != null &&
					!listRef.current!.contains(e.target as Node))
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("keydown", handleCloseMenu);
		document.addEventListener("click", handleCloseMenu);
		document.addEventListener("contextmenu", handleCloseMenu);

		return () => {
			document.removeEventListener("keydown", handleCloseMenu);
			document.removeEventListener("click", handleCloseMenu);
			document.removeEventListener("contextmenu", handleCloseMenu);
		};
	}, [parentRef]);

	return isOpen ? (
		isMobile ? (
			<div className={styles.contextmenu_background_mobile}>
				<ul
					className={styles.contextmenu}
					onContextMenu={(e) => e.preventDefault()}
					ref={listRef}
					style={{
						bottom: 0,
						left: 0,
						paddingBottom: 100,
					}}
				>
					<ExpandMoreIcon className={styles.contextmenu_icon} />
					{children}
				</ul>
			</div>
		) : (
			<ul
				className={styles.contextmenu}
				style={{ top: menuPoint.y, left: menuPoint.x }}
				onContextMenu={(e) => e.preventDefault()}
				ref={listRef}
			>
				{children}
			</ul>
		)
	) : null;
};

export default forwardRef(ContextMenu);
