import React, { useRef } from "react";
import styles from "../../../styles/components/chat/members/Member.module.scss";
import { Avatar } from "@material-ui/core";

interface MemberProps {
  id: string;
  name: string;
  nameColor: string;
  avatar: string;
}

export interface MemberData {
  id: string;
  name: string;
  nameColor: string;
  avatar: string;
}

export const Member: React.FC<MemberProps> = ({
  id,
  name,
  nameColor,
  avatar,
}) => {
  return (
    <div className={styles.member} id={id}>
      <div className={styles.member_avatar}>
        <Avatar
          style={{ height: "45px", width: "45px" }}
          src={
            avatar
              ? avatar
              : "https://www.pngall.com/wp-content/uploads/5/User-Profile-PNG-High-Quality-Image.png"
          }
        />
      </div>
      <h4 style={{ color: nameColor ? nameColor : "white" }}>{name}</h4>
    </div>
  );
};
