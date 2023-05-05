import { useChannel } from "context/channelContext";
import React, { useEffect, useState } from "react";
import styles from "../../../styles/components/chat/navbar/NavbarChannel.module.scss";

interface NavbarChannelProps {
  name: string;
  id: string;
  idC: string;
}

export const NavbarChannel: React.FC<NavbarChannelProps> = ({
  name,
  id,
  idC,
}) => {
  const [isActive, setActive] = useState(false);
  const { channel, setChannelData } = useChannel();

  useEffect(() => {
    if (channel.id == id) setActive(true);
    else setActive(false);
  }, [channel.id, id]);

  const handleToggle = () => {
    setActive(true);
    setChannelData(id, name, idC);
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
