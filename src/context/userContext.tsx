import { useState, useEffect, createContext, useContext } from "react";
import { getAuth, getIdToken, onAuthStateChanged } from "firebase/auth";
import { createFirebaseApp } from "../firebase-utils/clientApp";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { Moment } from "moment";
import moment from "moment";

export type MemberPermission =
	| "MODERATE_MESSAGES"
	| "MANAGE_CHANNELS"
	| "SEND_MESSAGES"
	| "VIEW_CHANNEL";

export type ParticipantPermission = "SEND_MESSAGES" | "VIEW_CHANNEL";

export type User = {
	token: string;
	uid: string;
	username: string;
	avatar: string;
	tag: string;
	nickname: string;
	verified: boolean;
	lastActive: number;
	permissions: MemberPermission[];
	partPermissions: ParticipantPermission[];
};

export interface UserContextType {
	user: User;
	setUserData: (
		token: string,
		uid: string,
		username: string,
		avatar: string,
		tag: string
	) => void;
	setMemberData: (nickname: string, permissions: MemberPermission[]) => void;
	addPartPerms: (permissions: ParticipantPermission[]) => void;
	setActivity: (lastActive: number) => void;
	loadingUser: boolean;
}

export const UserContext = createContext<UserContextType>({
	user: {
		token: "",
		uid: "",
		username: "",
		avatar: "",
		tag: "",
		nickname: "",
		verified: false,
		lastActive: 0,
		permissions: [],
		partPermissions: [],
	},
	setUserData: (
		_uid: string,
		_username: string,
		_avatar: string,
		_tag: string
	) => undefined,
	setMemberData: (_nickname: string, _permissions: MemberPermission[]) =>
		undefined,
	addPartPerms: (_permissions: ParticipantPermission[]) => undefined,
	setActivity: (_lastActive: number) => undefined,
	loadingUser: false,
});

export default function UserContextComp({ children }: any) {
	const [user, setUser] = useState<User>({
		token: "",
		uid: "",
		username: "",
		avatar: "",
		tag: "",
		nickname: "",
		verified: false,
		lastActive: 0,
		permissions: [],
		partPermissions: [],
	});
	const [loadingUser, setLoadingUser] = useState(true);

	const app = createFirebaseApp();
	const auth = getAuth(app!);
	const db = getFirestore(app!);

	const setUserData = (
		token: string,
		uid: string,
		username: string,
		avatar: string,
		tag: string
	) => {
		setUser({
			...user,
			token: token,
			uid: uid,
			username: username,
			avatar: avatar,
			tag: tag,
		});
	};

	const setMemberData = (
		nickname: string,
		permissions: MemberPermission[]
	) => {
		setUser({
			...user,
			permissions: permissions,
			nickname: nickname,
		});
	};

	const setPartPerms = (permissions: ParticipantPermission[]) => {
		setUser({
			...user,
			partPermissions: permissions,
		});
	};

	const setActivity = (lastActive: number) => {
		setUser({
			...user,
			lastActive: lastActive,
		});
	};

	useEffect(() => {
		const interval = setInterval(async () => {
			const auth = await getAuth().currentUser;
			if (auth) {
				const token = await getIdToken(auth);
				setUser({
					...user,
					token: token,
				});
			}
		}, 3500000);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		const unsubscriber = onAuthStateChanged(auth, async (user) => {
			try {
				if (user) {
					console.log("uid: ", user.uid);
					const uid = user.uid;
					const docSnap = await getDoc(doc(db, "profile", uid));
					const token = await getIdToken(user);
					const verified = await auth.currentUser?.emailVerified!;
					if (docSnap.exists())
						setUser({
							token: token,
							uid: uid,
							username: docSnap.data().username,
							avatar: docSnap.data().avatar
								? docSnap.data().avatar
								: "",
							tag: docSnap.data().tag ? docSnap.data().tag : "",
							nickname: "",
							verified: verified,
							lastActive: moment().valueOf(),
							permissions: [],
							partPermissions: [],
						});
				} else
					setUser({
						token: "",
						uid: "",
						username: "",
						avatar: "",
						tag: "",
						nickname: "",
						verified: false,
						lastActive: 0,
						permissions: [],
						partPermissions: [],
					});
			} catch (error) {
				console.log("ERROR: unable to get user");
			} finally {
				setLoadingUser(false);
			}
		});

		return () => unsubscriber();
	}, []);

	return (
		<UserContext.Provider
			value={{
				user,
				setUserData,
				setMemberData,
				addPartPerms: setPartPerms,
				setActivity,
				loadingUser,
			}}
		>
			{children}
		</UserContext.Provider>
	);
}

export const useUser = () => useContext(UserContext);
