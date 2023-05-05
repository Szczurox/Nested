import { useState, useEffect, createContext, useContext } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { createFirebaseApp } from "../firebase/clientApp";
import { doc, getDoc, getFirestore } from "firebase/firestore";

export interface UserContextType {
  user: {
    uid: string;
    username: string;
    avatar: string;
  };
  setUserData: (uid: string, username: string, avatar: string) => void;
  loadingUser: boolean;
}

export const UserContext = createContext<UserContextType>({
  user: { uid: "", username: "", avatar: "" },
  setUserData: (uid: string, username: string, avatar: string) => undefined,
  loadingUser: false,
});

export default function UserContextComp({ children }: any) {
  const [user, setUser] = useState({ uid: "", username: "", avatar: "" });
  const [loadingUser, setLoadingUser] = useState(true);

  const setUserData = (uid: string, username: string, avatar: string) => {
    setUser({ uid: uid, username: username, avatar: avatar });
  };

  useEffect(() => {
    const app = createFirebaseApp();
    const auth = getAuth(app!);
    const db = getFirestore(app!);
    const unsubscriber = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const uid = user.uid;
          const docSnap = await getDoc(doc(db, "profile", uid));
          if (docSnap.exists())
            setUser({
              uid: uid,
              username: docSnap.data().username,
              avatar: docSnap.data().avatar ? docSnap.data().avatar : "",
            });
        } else setUser({ uid: "", username: "", avatar: "" });
      } catch (error) {
        console.log("ERROR: unable to get user");
      } finally {
        setLoadingUser(false);
      }
    });

    return () => unsubscriber();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUserData, loadingUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
