import { EmojiData } from "components/chat/ui-icons/Emoji";
import { createFirebaseApp } from "../../firebase/clientApp";
import {
  getFirestore,
  collection,
  where,
  query,
  limit,
  getDocs,
} from "firebase/firestore";

const app = createFirebaseApp();
const db = getFirestore(app!);

export const getEmoji = async (
  name: string,
  guild: string
): Promise<EmojiData | undefined> => {
  console.log(name, guild);
  const emojiCollection = collection(db, "groups", guild, "emoji");
  const qEmoji = query(emojiCollection, where("name", "==", name), limit(1));
  const querySnapshot = await getDocs(qEmoji);

  return new Promise((resolve) =>
    resolve(
      querySnapshot.docs[0]
        ? {
            id: querySnapshot.docs[0].id,
            file: querySnapshot.docs[0].data().file,
            name: querySnapshot.docs[0].data().name,
            createdAt: querySnapshot.docs[0].data().createdAt,
          }
        : undefined
    )
  );
};
