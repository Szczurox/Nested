import React, { useEffect, useState } from "react";
import styles from "../../styles/components/chat/Members.module.scss";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useChannel } from "context/channelContext";
import { createFirebaseApp } from "../../firebase-utils/clientApp";
import {
	getFirestore,
	collection,
	query,
	onSnapshot,
} from "firebase/firestore";
import { Member, MemberData } from "./members/Member";
import { MemberCount } from "./members/MemberCount";

export type MembersVariant = "server" | "dms";

type FilterType = "online" | "offline" | "none";

interface MembersProps {
	isMobile: boolean;
	show: boolean;
	qu: string; // Search query by member name
}

const Members: React.FC<MembersProps> = ({ isMobile, show, qu }) => {
	// Members flter query
	const [filter, setFilter] = useState<string>(qu);
	const [members, setMembers] = useState<MemberData[]>([]);
	const [online, setOnline] = useState<string[]>([]);
	const [offline, setOffline] = useState<string[]>([]);

	const { channel } = useChannel();

	const app = createFirebaseApp();
	const db = getFirestore(app!);

	useEffect(() => {
		setFilter(qu);
	}, [qu]);

	useEffect(() => {
		async function getMembers() {
			const membersCollection = collection(
				db,
				"groups",
				channel.idG,
				"members"
			);
			// Members query
			const qMem = query(membersCollection);

			const unsub = onSnapshot(qMem, (querySnapshot) => {
				querySnapshot.docChanges().forEach(async (change) => {
					if (
						change.type === "removed" ||
						change.type == "modified"
					) {
						setMembers((members) =>
							[
								...members.filter(
									(el) => el.id !== change.doc.id
								),
							].sort((x, y) => {
								return x.name.localeCompare(y.name);
							})
						);
					}
					if (change.type === "added" || change.type === "modified") {
						setMembers((members) =>
							[
								...members.filter(
									(el) => el.id !== change.doc.id
								),
								{
									id: change.doc.id,
									nameColor: change.doc.data().nameColor,
									name: change.doc.data().nickname,
									avatar: change.doc.data().avatar,
								},
							].sort((x, y) => {
								return x.name.localeCompare(y.name);
							})
						);
					}
					if (change.type === "added") {
						setOnline((online) => [...online, change.doc.id]);
					}
				});
			});

			return unsub;
		}

		getMembers();
	}, [channel.idG, db]);

	const filterMember = (filterType: FilterType, memberId: string) => {
		const isFiltered =
			filter != "" ? memberId.toLowerCase().includes(filter) : true;
		if (filterType == "online")
			return online.includes(memberId) && isFiltered;
		else if (filterType == "offline")
			return offline.includes(memberId) && isFiltered;
		else return isFiltered;
	};

	const filterMembers = (filterType: FilterType) => {
		if (filterType == "online")
			return members.filter(
				(el) =>
					online.includes(el.id) &&
					(filter != ""
						? el.name.toLowerCase().includes(filter)
						: true)
			);
		else if (filterType == "offline")
			return members.filter(
				(el) =>
					offline.includes(el.id) &&
					(filter != ""
						? el.name.toLowerCase().includes(filter)
						: true)
			);
		else
			return filter != ""
				? members.filter((el) => el.name.toLowerCase().includes(filter))
				: members;
	};

	const changeActivity = (id: string, activity: boolean) => {
		if (activity) {
			setOnline((online) => [...online, id]);
			setOffline((offline) => [...offline.filter((el) => el !== id)]);
		} else {
			setOnline((online) => [...online.filter((el) => el !== id)]);
			setOffline((offline) => [...offline, id]);
		}
	};

	return (
		<div
			className={styles.members}
			style={{
				display: !show ? "none" : undefined,
			}}
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
							onChange={(e) => setFilter(e.currentTarget.value)}
						/>
						<SearchRoundedIcon />
					</div>
				</div>
			)}
			{members.length != 0 && (
				<MemberCount
					name="Members"
					count={filterMembers("none").length}
				/>
			)}
			{members.length != 0 && !filter && (
				<MemberCount
					name="Online"
					count={filterMembers("online").length}
				/>
			)}
			{members.map((member) => (
				<Member
					id={member.id}
					key={member.id}
					name={member.name}
					nameColor={member.nameColor}
					avatar={member.avatar}
					changeActivity={changeActivity}
					isVisible={filterMember("online", member.id)}
				/>
			))}
			{members.length != 0 && !filter && (
				<MemberCount
					name="Offline"
					count={filterMembers("offline").length}
				/>
			)}
			{members.map((member) => (
				<Member
					id={member.id}
					key={member.id}
					name={member.name}
					nameColor={member.nameColor}
					avatar={member.avatar}
					changeActivity={changeActivity}
					isVisible={filterMember("offline", member.id)}
				/>
			))}
		</div>
	);
};

export default Members;
