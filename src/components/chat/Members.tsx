import React, { useEffect, useState } from "react";
import styles from "../../styles/components/chat/Members.module.scss";
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

interface MembersProps {
  variant?: MembersVariant;
}

const Members: React.FC<MembersProps> = ({ variant = "server" }) => {
  const [members, setMembers] = useState<MemberData[]>([]);

  const { channel } = useChannel();

  const app = createFirebaseApp();
  const db = getFirestore(app!);

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
          if (change.type === "removed" || change.type == "modified") {
            setMembers((members) =>
              [...members.filter((el) => el.id !== change.doc.id)].sort(
                (x, y) => {
                  return x.name.localeCompare(y.name);
                }
              )
            );
          }
          if (change.type === "added" || change.type === "modified") {
            setMembers((members) =>
              [
                ...members.filter((el) => el.id !== change.doc.id),
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
        });
      });

      return unsub;
    }

    getMembers();
  }, [channel.idG, db]);

  return (
    <div className={styles.members}>
      {members.length != 0 && <MemberCount count={members.length} />}
      {members.map((member) => (
        <Member
          id={member.id}
          key={member.id}
          name={member.name}
          nameColor={member.nameColor}
          avatar={member.avatar}
        />
      ))}
    </div>
  );
};

export default Members;
