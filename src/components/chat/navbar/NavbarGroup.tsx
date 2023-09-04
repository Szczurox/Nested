import styles from "../../../styles/components/chat/navbar/NavbarGroup.module.scss";
import { useChannel } from "context/channelContext";
import GroupsIcon from "@mui/icons-material/Groups";
import { Avatar } from "@material-ui/core";
import { useEffect, useState } from "react";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useUser } from "context/userContext";
import { createFirebaseApp } from "firebase-utils/clientApp";

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
  const { channel, setGroupData } = useChannel();
  const [isSelected, setIsSelected] = useState<boolean>(false);
  const [isHover, setIsHover] = useState<boolean>(false);

  const { user } = useUser();

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  const getLastViewed = async () => {
    const memberDoc = doc(db, "groups", id, "members", user.uid);
    const docSnapMember = await getDoc(memberDoc);
    if (docSnapMember.exists())
      setGroupData(id, docSnapMember.data().lastViewed);
  };

  const handleToggle = () => {
    console.log(id);
    if (!isSelected) getLastViewed();
    if (isSelected && isMobile) setIsHover(false);
  };

  useEffect(() => {
    if (channel.idG == id) setIsSelected(true);
    else setIsSelected(false);
  }, [channel.idG]);

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
