import React, { useCallback, useEffect, useState } from "react";
import styles from "@/styles/components/chat/Members.module.scss";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useChannel } from "@/context/channelContext";
import {
	createServerSocket,
	serverRequest,
} from "@/global-utils/serverClient";
import { Member, MemberData } from "./members/Member";
import { MemberCount } from "./members/MemberCount";
import { useUser } from "@/context/userContext";

export type MembersVariant = "server" | "dms";
interface MembersProps {
	isMobile: boolean;
	show: boolean;
	qu: string;
}

const Members: React.FC<MembersProps> = ({ isMobile, show, qu }) => {
	const [filter, setFilter] = useState(qu);
	const [members, setMembers] = useState<MemberData[]>([]);
	const [online, setOnline] = useState<string[]>([]);
	const [offline, setOffline] = useState<string[]>([]);
	const { channel } = useChannel();
	const { user } = useUser();

	useEffect(() => {
		setFilter(qu);
	}, [qu]);

	useEffect(() => {
		setMembers([]);
		if (!channel.idG || channel.idG === "@dms") return;
		const socket = createServerSocket();
		if (channel.id) {
			socket.on("connect", () => {
				socket.emit("channel.join", { channelId: channel.id });
				changeActivity(channel.id, true);
			});
		}
		socket.on(
			"presence.updated",
			(event: { userId: string; connected: boolean }) => {
				changeActivity(event.userId, event.connected);
			},
		);
		serverRequest<{
			members: Array<{
				userId: string;
				nickname: string;
				profileNickname?: string;
				avatarUrl: string | null;
				nameColor: string;
			}>;
		}>(`/api/groups/${channel.idG}/members`)
			.then(({ members: groupMembers }) => {
				setMembers(
					groupMembers.map((member) => ({
						id: member.userId,
						name: member.profileNickname ?? member.nickname,
						nameColor: member.nameColor,
						avatar: member.avatarUrl ?? "",
					})),
				);
				setOnline([user.uid]);
				setOffline(
					groupMembers
						.map((member) => member.userId)
						.filter((id) => id !== user.uid),
				);
			})
			.catch((error) =>
				console.error("Unable to load group members", error),
			);
		return () => {
			if (channel.id)
				socket.emit("channel.leave", { channelId: channel.id });
			socket.disconnect();
		};
	}, [channel.id, channel.idG, user.uid]);

	useEffect(() => {
		const refreshMembers = (event: Event) => {
			const detail = (event as CustomEvent<{ groupId: string }>).detail;
			if (detail.groupId !== channel.idG) return;
			serverRequest<{
				members: Array<{
					userId: string;
					nickname: string;
					profileNickname?: string;
					avatarUrl: string | null;
					nameColor: string;
				}>;
			}>(`/api/groups/${channel.idG}/members`)
				.then(({ members: groupMembers }) =>
					setMembers(
						groupMembers.map((member) => ({
							id: member.userId,
							name: member.profileNickname ?? member.nickname,
							nameColor: member.nameColor,
							avatar: member.avatarUrl ?? "",
						})),
					),
				)
				.catch((error) =>
					console.error("Unable to refresh group members", error),
				);
		};
		window.addEventListener("nested:user-updated", refreshMembers);
		return () =>
			window.removeEventListener("nested:user-updated", refreshMembers);
	}, [channel.idG]);

	const filtered = (list: MemberData[]) =>
		list.filter(
			(member) =>
				!filter ||
				member.name.toLowerCase().includes(filter.toLowerCase()),
		);
	const visible = (kind: "online" | "offline") =>
		filtered(
			members.filter((member) =>
				(kind === "online" ? online : offline).includes(member.id),
			),
		);
	const changeActivity = useCallback((id: string, active: boolean) => {
		if (active) {
			setOnline((current) =>
				current.includes(id) ? current : [...current, id],
			);
			setOffline((current) => current.filter((item) => item !== id));
		} else {
			setOnline((current) => current.filter((item) => item !== id));
			setOffline((current) =>
				current.includes(id) ? current : [...current, id],
			);
		}
	}, []);
	const renderMembers = (list: MemberData[]) =>
		list.map((member) => (
			<Member
				key={member.id}
				{...member}
				isActive={online.includes(member.id)}
				isVisible
			/>
		));

	return (
		<div
			className={styles.members}
			style={{ display: !show ? "none" : undefined }}
		>
			{isMobile && (
				<div className={styles.members_header}>
					<h3>
						<span className={styles.members_header_hash}>#</span>
						{channel.name}
					</h3>
					<div className={styles.chatHeader_search}>
						<input
							placeholder="Search"
							value={filter}
							onChange={(event) =>
								setFilter(event.currentTarget.value)
							}
						/>
						<SearchRoundedIcon />
					</div>
				</div>
			)}
			{filtered(members).length > 0 && (
				<MemberCount name="Members" count={filtered(members).length} />
			)}
			{visible("online").length > 0 && !filter && (
				<MemberCount name="Online" count={visible("online").length} />
			)}
			{renderMembers(visible("online"))}
			{visible("offline").length > 0 && !filter && (
				<MemberCount name="Offline" count={visible("offline").length} />
			)}
			{renderMembers(visible("offline"))}
		</div>
	);
};

export default Members;
