import React, { useEffect, useState } from "react";
import styles from "@/styles/components/chat/NavbarGroups.module.scss";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import AddIcon from "@mui/icons-material/Add";
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
} from "@mui/material";
import { NavbarGroup } from "./navbar/NavbarGroup";
import { NavbarVariant } from "./Navbar";
import { useChannel } from "@/context/channelContext";
import { useUser } from "@/context/userContext";
import { useRouter } from "next/router";
import { serverRequest } from "@/global-utils/serverClient";

interface NavbarGroupsProps {
	variantChange: (variant: NavbarVariant) => void;
	isMobile: boolean;
}

export const NavbarGroups: React.FC<NavbarGroupsProps> = ({
	variantChange,
	isMobile,
}) => {
	const [variant, setVariant] = useState<boolean>(true);
	const [isHovering, setIsHovering] = useState<boolean>(true);
	const [groups, setGroups] = useState<string[]>([]);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [groupName, setGroupName] = useState("");
	const [createError, setCreateError] = useState("");

	const router = useRouter();
	const { channel } = useChannel();
	const { user } = useUser();

	const getGroups = async () => {
		const response = await serverRequest<{ groups: Array<{ id: string }> }>(
			"/api/groups",
		);
		const nextGroups = response.groups.map((group) => group.id).sort();
		setGroups(nextGroups);
		return nextGroups;
	};

	const createGroup = async () => {
		const name = groupName.trim();
		if (!name) {
			setCreateError("Enter a group name");
			return;
		}

		try {
			const response = await serverRequest<{ group: { id: string } }>(
				"/api/groups",
				{
					method: "POST",
					body: JSON.stringify({ name }),
				},
			);
			await getGroups();
			setCreateDialogOpen(false);
			setGroupName("");
			setCreateError("");
			router.push(`/chat/${response.group.id}`);
		} catch (error) {
			setCreateError(
				error instanceof Error
					? error.message
					: "Unable to create group",
			);
		}
	};

	const handleClick = () => {
		variantChange("dms");
		router.push("/chat/@dms");
		setVariant(false);
	};

	useEffect(() => {
		if (channel.idG == "@dms") {
			variantChange("dms");
			setVariant(false);
		} else {
			setVariant(true);
			variantChange("server");
		}
	}, [channel.idG, variantChange]);

	useEffect(() => {
		async function loadGroups() {
			try {
				await getGroups();
			} catch (error) {
				console.error("Unable to load groups", error);
				setGroups([]);
			}
		}

		if (user.uid != "") loadGroups();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user.uid]);

	useEffect(() => {
		localStorage.setItem("groups", JSON.stringify(groups));
	}, [groups]);

	return (
		<div className={styles.navbar_groups}>
			<div
				className={styles.navbar_groups_chat}
				onClick={() => handleClick()}
				style={
					variant
						? {}
						: isHovering
							? {
									borderRadius: "8px",
									backgroundColor: "#5d6569",
								}
							: {
									borderRadius: "8px",
									backgroundColor: "#51575a",
								}
				}
				onMouseEnter={() => setIsHovering(true)}
				onMouseLeave={() => setIsHovering(false)}
			>
				<ChatBubbleIcon />
			</div>
			<hr className={styles.navbar_groups_separator} />
			<div className={styles.navbar_groups_groups}>
				{groups.map((group) => (
					<NavbarGroup id={group} isMobile={isMobile} key={group} />
				))}
				<button
					type="button"
					className={styles.navbar_groups_add}
					aria-label="Create group"
					onClick={() => {
						setCreateError("");
						setCreateDialogOpen(true);
					}}
				>
					<AddIcon />
				</button>
			</div>
			<Dialog
				open={createDialogOpen}
				onClose={() => setCreateDialogOpen(false)}
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
				<DialogTitle sx={{ color: "white" }}>
					Create a group
				</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						fullWidth
						margin="dense"
						label="Group name"
						value={groupName}
						onChange={(event) => setGroupName(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") createGroup();
						}}
						error={Boolean(createError)}
						helperText={createError}
						slotProps={{
							htmlInput: { maxLength: 80 },
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setCreateDialogOpen(false)}>
						Cancel
					</Button>
					<Button variant="contained" onClick={createGroup}>
						Create
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};
