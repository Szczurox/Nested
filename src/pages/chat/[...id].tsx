import styles from "../../styles/Chat.module.scss";
import { Navbar, NavbarVariant } from "../../components/chat/Navbar";
import React, { useEffect, useState } from "react";
import { useUser } from "context/userContext";
import { useRouter } from "next/router";
import { ChatMain } from "components/chat/ChatMain";
import Loading from "components/Loading";
import { wait } from "components/utils/utils";
import { createFirebaseApp } from "../../global-utils/clientApp";
import {
	doc,
	getFirestore,
	onSnapshot,
	serverTimestamp,
	updateDoc,
} from "firebase/firestore";
import { useChannel } from "context/channelContext";
import Members from "components/chat/Members";
import ChatHeader from "components/chat/ChatHeader";
import useMediaQuery from "@mui/material/useMediaQuery";
import { NavbarGroups } from "components/chat/NavbarGroups";

const Chat = () => {
	const [showNavbar, setShowNavbar] = useState<boolean>(true); // Show channels navbar
	const [showMembers, setShowMembers] = useState<boolean>(true); // Show members navbar
	const [membersQuery, setMembersQuery] = useState<string>(""); // Show members navbar
	const [variant, setVariant] = useState<NavbarVariant>("server");

	const { user, loadingUser, setMemberData } = useUser();
	const { channel, setGroupData } = useChannel();

	const router = useRouter();
	const { id } = router.query;

	const app = createFirebaseApp();
	const db = getFirestore(app!);

	const isMobile = useMediaQuery("(pointer: none), (pointer: coarse)");

	useEffect(() => {
		console.log("isMobile: " + isMobile);
		if (isMobile) setShowMembers(false);
	}, [isMobile]);

	useEffect(() => {
		if (!router.isReady || !id) return;
		const idTyped = id as string[];
		if (idTyped[0] != "@dms") {
			if (idTyped.length == 1) setGroupData(id[0], "undefined");
			else if (id[1] != "undefined") setGroupData(id[0], id[1]);
			else setGroupData(id[0], "undefined");
		} else setGroupData("@dms", "\n", "Direct Messages");

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, router.isReady]);

	// Route to login if user is not authenticated
	useEffect(() => {
		if (!user.verified && !loadingUser && user.uid != "")
			router.push("/signout");
		else if (user.uid == "" && !loadingUser && user.token == "")
			router.push("/login");
		else loading();

		async function loading() {
			setShowNavbar(true);
			setShowMembers(true);
			if (typeof window !== "undefined") {
				const loader = document.getElementById("globalLoader");
				if (loader) {
					await wait(600).then(async () => {
						// Notify server that user is active
						if (user.uid != "") {
							console.log("hi");

							// TODO: disabled for now to lower server load
							/*await updateDoc(doc(db, "profile", user.uid), {
								lastActive: serverTimestamp(),
							});*/

							await updateDoc(doc(db, "profile", user.uid), {
								lastMessagedAt: serverTimestamp(),
							}).catch((err) => {
								console.log(err);
							});

							if (isMobile) {
								setShowNavbar(false);
								setShowMembers(false);
							}
						}
					});
					loader.remove();
				}
			}
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user.uid, loadingUser]);

	useEffect(() => {
		async function checkMember() {
			if (user.uid != "" && channel.idG != "@dms") {
				setShowMembers(false);

				const memberDoc = doc(
					db,
					"groups",
					channel.idG,
					"members",
					user.uid
				);

				const unsub = onSnapshot(memberDoc, (docSnapMember) => {
					if (docSnapMember.exists()) {
						setMemberData(
							docSnapMember.data().nickname,
							docSnapMember.data().permissions
						);
						if (docSnapMember.data().lastViewed) {
							router.push(
								`/chat/${channel.idG}/${
									docSnapMember.data().lastViewed
								}`,
								undefined,
								{ shallow: true }
							);
						} else {
							router.push(
								`/chat/${channel.idG}/${undefined}`,
								undefined,
								{ shallow: true }
							);
						}
					}
				});

				setShowMembers(true);

				return unsub;
			} else return () => {};
		}

		checkMember();

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [channel.idG, user.uid]);

	function onMembers(q?: string) {
		if (q == undefined) setShowMembers(!showMembers);
		else {
			setShowMembers(true);
			setMembersQuery(q.toLocaleLowerCase());
		}
	}

	useEffect(() => {
		setShowNavbar(false);
	}, [channel.id]);

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
						onMembers={(q) => onMembers(q)}
						isMembersOpen={showMembers}
						isNavbarOpen={showNavbar ? true : false}
						setShowNavbar={(show) => setShowNavbar(show)}
						variant={variant}
					/>
				</div>
				<div className={styles.chat_flexbox}>
					<ChatMain
						isNavbarOpen={showNavbar}
						hideNavbar={() => {
							setShowNavbar(false);
							if (isMobile) setShowMembers(false);
						}}
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
