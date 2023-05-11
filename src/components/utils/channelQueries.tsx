import { createFirebaseApp } from "../../firebase/clientApp";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const app = createFirebaseApp();
const db = getFirestore(app!);

export const addChannel = async (
  channelName: string,
  guild: string,
  category: string = ""
) => {
  const channelsCollection = collection(db, "groups", guild, "channels");

  await addDoc(channelsCollection, {
    name: channelName.replace(/\s/g, "").length ? channelName : "new-channel",
    createdAt: serverTimestamp(),
    categoryId: category,
  });
};
