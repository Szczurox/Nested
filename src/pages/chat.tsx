import styles from "../styles/Chat.module.scss";
import { Navbar, NavbarVariant } from "../components/chat/Navbar";
import React, { useEffect, useState } from "react";
import { useUser } from "context/userContext";
import { useRouter } from "next/router";
import { ChatMain } from "components/chat/ChatMain";
import Loading from "components/Loading";
import { wait } from "components/utils/utils";
import { createFirebaseApp } from "../firebase-utils/clientApp";
import {
	DocumentData,
	DocumentSnapshot,
	doc,
	getDoc,
	getFirestore,
	onSnapshot,
	serverTimestamp,
	setDoc,
	updateDoc,
} from "firebase/firestore";
import { useChannel } from "context/channelContext";
import Members from "components/chat/Members";
import ChatHeader from "components/chat/ChatHeader";
import useMediaQuery from "@mui/material/useMediaQuery";
import { NavbarGroups } from "components/chat/NavbarGroups";
import moment from "moment";

const Chat = () => {
	const [showNavbar, setShowNavbar] = useState<boolean>(true); // Show channels navbar
	const [showMembers, setShowMembers] = useState<boolean>(true); // Show members navbar
	const [membersQuery, setMembersQuery] = useState<string>(""); // Show members navbar
	const [variant, setVariant] = useState<NavbarVariant>("server");

	const { user, loadingUser, setMemberData, setActivity } = useUser();
	const { channel, setChannelData } = useChannel();

	const router = useRouter();

	const app = createFirebaseApp();
	const db = getFirestore(app!);

	const isMobile = useMediaQuery("(pointer: none), (pointer: coarse)");

	useEffect(() => {
		console.log("isMobile: " + isMobile);
		if (isMobile) setShowMembers(false);
	}, [isMobile]);

	useEffect(() => {
		const interval = setInterval(async () => {
			if (
				moment().valueOf() > user.lastActive + 150000 &&
				user.uid != ""
			) {
				console.log("ping!", user.uid);
				setActivity(moment().valueOf());
				await updateDoc(doc(db, "profile", user.uid), {
					lastActive: serverTimestamp(),
				});
			}
		}, 1500);

		return () => clearInterval(interval);
	});

	// Route to login if user is not authenticated
	useEffect(() => {
		if (user.uid == "" && !loadingUser && user.token == "")
			router.push("/login");
		else loading();

		async function loading() {
			console.log("logged out");
			setShowNavbar(true);
			setShowMembers(true);
			if (typeof window !== "undefined") {
				const loader = document.getElementById("globalLoader");
				if (loader) {
					await wait(600).then(async () => {
						// Notify server that user is active
						if (user.uid != "") {
							console.log("hi");
							await updateDoc(doc(db, "profile", user.uid), {
								lastActive: serverTimestamp(),
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
	}, [user.uid, loadingUser]);

	useEffect(() => {
		async function setUserPerms(
			docSnapMember: DocumentSnapshot<DocumentData>
		) {
			if (docSnapMember.exists()) {
				setMemberData(
					docSnapMember.data().nickname,
					docSnapMember.data().permissions
				);
			}
		}

		// Adds user to members of the group if isn't one yet (temp till multiple groups)
		async function checkMember() {
			const memberDoc = doc(
				db,
				"groups",
				channel.idG,
				"members",
				user.uid
			);
			const docSnapMember = await getDoc(memberDoc);
			let unsub: () => void;
			if (docSnapMember.exists()) {
				setChannelData(docSnapMember.data().lastViewed);
				unsub = onSnapshot(memberDoc, (docSnapMember) =>
					setUserPerms(docSnapMember)
				);
			} else {
				await setDoc(memberDoc, {
					nickname: user.username,
					avatar: user.avatar,
					nameColor: "",
					permissions: [],
				});
				unsub = onSnapshot(memberDoc, (docSnapMember) =>
					setUserPerms(docSnapMember)
				);
			}
			return unsub;
		}

		let unsub: () => void = () => undefined;

		if (user.uid != "") checkMember().then((result) => (unsub = result));
		return () => {
			unsub();
		};
	}, [user.uid, channel.idG]);

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
			{!isMobile || showNavbar ? (
				<div className={styles.full_navbar_flexbox}>
					<NavbarGroups
						isMobile={isMobile}
						variantChange={(variant: NavbarVariant) =>
							setVariant(variant)
						}
					/>
					<Navbar variant={variant} isMobile={isMobile} />
				</div>
			) : null}
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
					{showMembers && variant === "server" && (
						<Members isMobile={isMobile} qu={membersQuery} />
					)}
				</div>
			</div>
		</div>
	) : null;
};

export default Chat;
