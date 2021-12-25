import React, { useState } from "react";
import styles from "../../../styles/components/chat/navbar/NavbarChannel.module.scss";

interface NavbarChannelProps {
  name: String;
}

export const NavbarChannel: React.FC<NavbarChannelProps> = ({ name }) => {
  const [isActive, setActive] = useState(true);

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
      id="ass"
      onClick={handleToggle}
    >
      <h4>
        <span className={styles.hash}>#</span>
        <div className={styles.channel_name}>{name}</div>
      </h4>
    </div>
  );
};
