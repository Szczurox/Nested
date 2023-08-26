import styles from "../../../styles/components/chat/navbar/NavbarGroup.module.scss";
import { useChannel } from "context/channelContext";
import GroupsIcon from "@mui/icons-material/Groups";
import { Avatar } from "@material-ui/core";
import { useState } from "react";

interface NavbarGroupProps {
  isMobile: boolean;
  icon?: string;
  id: string;
}

export const NavbarGroup: React.FC<NavbarGroupProps> = ({
  id,
  icon = "https://pbs.twimg.com/profile_images/949787136030539782/LnRrYf6e_400x400.jpg",
  isMobile,
}) => {
  const { channel } = useChannel();
  const [isSelected, setIsSelected] = useState<boolean>(false);
  const [isHover, setIsHover] = useState<boolean>(false);

  const handleToggle = () => {
    if (isSelected && isMobile) setIsHover(false);
    setIsSelected(!isSelected);
  };

  return (
    <div
      className={styles.navbar_group}
      style={
        isSelected
          ? { border: "2px solid white" }
          : isHover
          ? { border: "2px solid grey" }
          : {}
      }
      onClick={handleToggle}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <Avatar src={icon} className={styles.navbar_group_icon} variant="square">
        <GroupsIcon />
      </Avatar>
    </div>
  );
};
