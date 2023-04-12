import { useState, useEffect, createContext, useContext } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { createFirebaseApp } from "../firebase/clientApp";
import { doc, getDoc, getFirestore } from "firebase/firestore";

export const UserContext = createContext(undefined as any);

export default function UserContextComp({ children }: any) {
  const [user, setUser] = useState({ uid: "", username: "" });
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const app = createFirebaseApp();
    const auth = getAuth(app);
    const db = getFirestore(app!);
    const unsubscriber = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const uid = user.uid;
          const docSnap = await getDoc(doc(db, "profile", uid));
          if (docSnap.exists())
            setUser({ uid: uid, username: docSnap.data().username });
        } else setUser({ uid: "", username: "" });
      } catch (error) {
        console.log("ERROR: unable to get user");
      } finally {
        setLoadingUser(false);
      }
    });

    return () => unsubscriber();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loadingUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
