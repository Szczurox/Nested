import React, { useState } from "react";
import styles from "../../../styles/components/chat/navbar/NavbarChannel.module.scss";

interface NavbarChannelProps {
  name: String;
  id: string;
}

export const NavbarChannel: React.FC<NavbarChannelProps> = ({ name, id }) => {
  const [isActive, setActive] = useState(false);

  const handleToggle = () => {
    setActive(!isActive);
    console.log(isActive);
  };
  return (
    <div
      className={
        isActive
          ? `${styles.channel} ${styles.active}`
          : `${styles.channel} ${styles.inactive}`
      }
      id={id}
      onClick={handleToggle}
    >
      <h4>
        <span className={styles.hash}>#</span>
        <div className={styles.channel_name}>{name}</div>
      </h4>
    </div>
  );
};
