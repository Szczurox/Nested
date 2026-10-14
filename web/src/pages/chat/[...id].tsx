import styles from "@/styles/Chat.module.scss";
import { Navbar, NavbarVariant } from "@/components/chat/Navbar";
import React, { useEffect, useState } from "react";
import { useUser } from "@/context/userContext";
import { useRouter } from "next/router";
import { ChatMain } from "@/components/chat/ChatMain";
import Loading from "@/components/Loading";
import { wait } from "@/components/utils/utils";
import { useChannel } from "@/context/channelContext";
import Members from "@/components/chat/Members";
import ChatHeader from "@/components/chat/ChatHeader";
import useMediaQuery from "@mui/material/useMediaQuery";
import { NavbarGroups } from "@/components/chat/NavbarGroups";
import { serverRequest } from "@/global-utils/serverClient";

const Chat = () => {
	const [showBookmarks, setShowBookmarks] = useState<boolean>(false);
	const [showNavbar, setShowNavbar] = useState<boolean>(true);
	const [showMembers, setShowMembers] = useState<boolean>(true);
	const [membersQuery, setMembersQuery] = useState<string>(""); // Search qury for member search
	const [variant, setVariant] = useState<NavbarVariant>("server");

	const { user, loadingUser, setMemberData } = useUser();
	const { channel, setGroupData } = useChannel();

	const router = useRouter();
	const { id } = router.query;

	const isMobile = useMediaQuery("(pointer: none), (pointer: coarse)");

	// Handle Mobile screen initial state
	useEffect(() => {
		console.log("isMobile: " + isMobile);
		if (isMobile) setShowMembers(false);
	}, [isMobile]);

	//  Handle parsing route ID parameters
	useEffect(() => {
		if (!router.isReady || !id) return;
		const idTyped = id as string[];
		if (idTyped[0] != "@dms") {
			if (idTyped.length == 1) setGroupData(id[0], "undefined");
			else if (id[1] != "undefined") setGroupData(id[0], id[1]);
			else setGroupData(id[0], "undefined");
		} else setGroupData("@dms", "\n", "Direct Messages");
	}, [id, router.isReady]);

	// Auth Guard
	useEffect(() => {
		if (loadingUser) return;

		if (user.uid === "") router.push("/login");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user.uid, loadingUser, router]);

	// Handle Global Loader removal
	useEffect(() => {
		if (loadingUser || user.uid === "") return;

		let isMounted = true;

		async function handleGlobalLoader() {
			setShowNavbar(true);
			setShowMembers(true);
			if (typeof window !== "undefined") {
				const loader = document.getElementById("globalLoader");
				if (loader) {
					await wait(600);
					if (!isMounted) return;
					if (isMobile) {
						setShowNavbar(false);
						setShowMembers(false);
					}
					loader.remove();
				}
			}
		}

		handleGlobalLoader();

		return () => {
			isMounted = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loadingUser, user.uid, isMobile]);

	// Check Group Membership data
	useEffect(() => {
		async function checkMember() {
			if (user.uid !== "" && channel.idG !== "@dms") {
				setShowMembers(false);
				try {
					const { member } = await serverRequest<{
						member: {
							nickname: string;
							permissions: Parameters<typeof setMemberData>[1];
						};
					}>(`/api/groups/${channel.idG}`);

					setMemberData(member.nickname, member.permissions);
					if (!isMobile) setShowMembers(true);
				} catch (error) {
					console.error("Unable to load group membership", error);
				}
			}
		}

		checkMember();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [channel.idG, user.uid]);

	// Close navbar on channel change
	useEffect(() => {
		setShowNavbar(false);
	}, [channel.id]);

	function onMembers(q?: string) {
		if (q == undefined) setShowMembers(!showMembers);
		else {
			setShowMembers(true);
			setMembersQuery(q.toLocaleLowerCase());
		}
	}
	// Render only if user is authenticated
	return user.uid ? (
		<div className={styles.app}>
			<Loading />
			<div
				className={styles.full_navbar_flexbox}
				style={{
					display: isMobile && !showNavbar ? "none" : undefined,
				}}
			>
				<NavbarGroups
					isMobile={isMobile}
					variantChange={(variant: NavbarVariant) =>
						setVariant(variant)
					}
				/>
				<Navbar variant={variant} isMobile={isMobile} />
			</div>
			<div className={styles.full_chat_flexbox}>
				<div className={styles.chat_shadow}>
					<ChatHeader
						isMobile={isMobile}
						onMembers={(q) => onMembers(q)}
						isMembersOpen={showMembers}
						isNavbarOpen={showNavbar ? true : false}
						setShowNavbar={(show) => setShowNavbar(show)}
						variant={variant}
						onBookmarks={(show) => setShowBookmarks(show)}
					/>
				</div>
				<div className={styles.chat_flexbox}>
					<ChatMain
						isNavbarOpen={showNavbar}
						hideNavbar={() => {
							setShowNavbar(false);
							if (isMobile) setShowMembers(false);
						}}
						isBookmarked={showBookmarks}
						isMembersOpen={showMembers}
					/>

					<Members
						isMobile={isMobile}
						qu={membersQuery}
						show={
							showMembers &&
							variant === "server" &&
							channel.type != "VOICE"
						}
					/>
				</div>
			</div>
		</div>
	) : null;
};

export default Chat;
