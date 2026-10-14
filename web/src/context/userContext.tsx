import { useState, useEffect, createContext, useContext } from "react";
import {
	serverRequest,
	toClientUser,
	type ServerUser,
} from "@/global-utils/serverClient";

export type MemberPermission =
	| "MODERATE_MESSAGES"
	| "MANAGE_CHANNELS"
	| "SEND_MESSAGES"
	| "VIEW_CHANNEL"
	| "MANAGE_EMOTES";

export type ParticipantPermission = "SEND_MESSAGES" | "VIEW_CHANNEL";

export type User = {
	token: string;
	uid: string;
	username: string;
	avatar: string;
	nick: string;
	serverNick: string;
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
		nick: string,
	) => void;
	setMemberData: (nickname: string, permissions: MemberPermission[]) => void;
	addPartPerms: (permissions: ParticipantPermission[]) => void;
	setActivity: (lastActive: number) => void;
	setProfileData: (username: string, avatar?: string, nick?: string) => void;
	loadingUser: boolean;
	refreshUser: () => Promise<void>; // Add this
}

export const UserContext = createContext<UserContextType>({
	user: {
		token: "",
		uid: "",
		username: "",
		avatar: "",
		nick: "",
		serverNick: "",
		verified: false,
		lastActive: 0,
		permissions: [],
		partPermissions: [],
	},
	setUserData: (
		_uid: string,
		_username: string,
		_avatar: string,
		_nick: string,
	) => undefined,
	setMemberData: (_nickname: string, _permissions: MemberPermission[]) =>
		undefined,
	addPartPerms: (_permissions: ParticipantPermission[]) => undefined,
	setActivity: (_lastActive: number) => undefined,
	setProfileData: (_username: string, _avatar?: string, _nick?: string) =>
		undefined,
	loadingUser: false,
	refreshUser: () => Promise.resolve(),
});

export default function UserContextComp({ children }: any) {
	const [user, setUser] = useState<User>({
		token: "",
		uid: "",
		username: "",
		avatar: "",
		nick: "",
		serverNick: "",
		verified: false,
		lastActive: 0,
		permissions: [],
		partPermissions: [],
	});
	const [loadingUser, setLoadingUser] = useState(true);

	const setUserData = (
		_token: string,
		uid: string,
		username: string,
		avatar: string,
		nick: string,
	) =>
		setUser((current) => ({
			...current,
			token: "",
			uid,
			username,
			avatar,
			nick,
			verified: true,
		}));

	const setMemberData = (
		nickname: string,
		permissions: MemberPermission[],
	) => {
		setUser((current) => ({
			...current,
			permissions: permissions,
			serverNick: nickname,
		}));
	};

	const setPartPerms = (permissions: ParticipantPermission[]) => {
		setUser((current) => ({
			...current,
			partPermissions: permissions,
		}));
	};

	const setActivity = (lastActive: number) => {
		setUser((current) => ({
			...current,
			lastActive: lastActive,
		}));
	};

	const setProfileData = (
		username: string,
		avatar?: string,
		nick?: string,
	) => {
		setUser((current) => ({
			...current,
			username: username,
			avatar: avatar ?? current.avatar,
			nick: nick ?? current.nick,
		}));
	};

	const refreshUser = async () => {
		try {
			const { user: serverUser } = await serverRequest<{
				user: ServerUser;
			}>("/api/auth/me");
			setUser(toClientUser(serverUser));
		} catch {
			setUser({
				token: "",
				uid: "",
				username: "",
				avatar: "",
				nick: "",
				serverNick: "",
				verified: false,
				lastActive: 0,
				permissions: [],
				partPermissions: [],
			});
		}
	};

	useEffect(() => {
		serverRequest<{ user: ServerUser }>("/api/auth/me")
			.then(({ user: serverUser }) => setUser(toClientUser(serverUser)))
			.catch(() => {
				setUser({
					token: "",
					uid: "",
					username: "",
					avatar: "",
					nick: "",
					serverNick: "",
					verified: false,
					lastActive: 0,
					permissions: [],
					partPermissions: [],
				});
			})
			.finally(() => setLoadingUser(false));
	}, []);

	return (
		<UserContext.Provider
			value={{
				user,
				setUserData,
				setMemberData,
				addPartPerms: setPartPerms,
				setActivity,
				setProfileData,
				loadingUser,
				refreshUser,
			}}
		>
			{children}
		</UserContext.Provider>
	);
}

export const useUser = () => useContext(UserContext);
