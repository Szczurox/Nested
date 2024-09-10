import React from "react";
import styles from "../../../styles/components/chat/members/MemberCount.module.scss";

interface MemberCountProps {
	name: string;
	count: number;
}

export const MemberCount: React.FC<MemberCountProps> = ({ name, count }) => {
	return (
		<div className={styles.member_count}>
			{name} - {count}
		</div>
	);
};
