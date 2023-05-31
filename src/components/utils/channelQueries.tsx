import { createFirebaseApp } from "../../firebase/clientApp";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  arrayUnion,
  setDoc,
  doc,
} from "firebase/firestore";

const app = createFirebaseApp();
const db = getFirestore(app!);

export const addChannel = async (
  channelName: string,
  guild: string,
  category: string = "",
  permissions: string[] = ["SEND_MESSAGES", "VIEW_CHANNEL"]
) => {
  const channelsCollection = collection(db, "groups", guild, "channels");

  await addDoc(channelsCollection, {
    name: channelName.replace(/\s/g, "").length ? channelName : "new-channel",
    createdAt: serverTimestamp(),
    categoryId: category,
  }).then(
    async (document) =>
      await setDoc(
        doc(channelsCollection, document.id, "participants", "everyone"),
        {
          permissions: arrayUnion(...permissions),
        }
      )
  );
};
