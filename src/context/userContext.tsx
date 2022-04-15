import { useState, useEffect, createContext, useContext } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { createFirebaseApp } from "../firebase/clientApp";

export const UserContext = createContext(undefined as any);

export default function UserContextComp({ children }: any) {
  const [user, setUser] = useState({ uid: "" });
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const app = createFirebaseApp();
    const auth = getAuth(app);
    const unsubscriber = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const uid = user.uid;
          setUser({ uid: uid });
        } else setUser({ uid: "" });
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
