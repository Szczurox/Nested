import { createFirebaseApp } from "../../firebase/clientApp";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const app = createFirebaseApp();
const db = getFirestore(app!);

export const addCategory = async (name: string, guild: string) => {
  if (name.replace(/\s/g, "").length) {
    const categoriesCollection = collection(db, "groups", guild, "categories");

    await addDoc(categoriesCollection, {
      name: name,
      createdAt: serverTimestamp(),
    });
  }
};
