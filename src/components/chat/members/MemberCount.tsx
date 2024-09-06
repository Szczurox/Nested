import React from "react";
import styles from "../../../styles/components/chat/members/MemberCount.module.scss";

export const MemberCount: React.FC<{ count: number }> = ({ count }) => {
	return <div className={styles.member_count}>Members - {count}</div>;
};
