import { ChannelType } from "context/channelContext";
import { createFirebaseApp } from "../../firebase-utils/clientApp";
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
  type: ChannelType = "text",
  permissions: string[] = ["SEND_MESSAGES", "VIEW_CHANNEL"]
) => {
  const channelsCollection = collection(db, "groups", guild, "channels");

  await addDoc(channelsCollection, {
    name: channelName.replace(/\s/g, "").length ? channelName : "new-channel",
    createdAt: serverTimestamp(),
    categoryId: category,
    type: type,
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
