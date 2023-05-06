import { useState, useEffect, createContext, useContext } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { createFirebaseApp } from "../firebase/clientApp";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useChannel } from "./channelContext";

export type UserPermission = "MODERATE_MESSAGES";

export type User = {
  uid: string;
  username: string;
  avatar: string;
  permissions: UserPermission[];
};

export interface UserContextType {
  user: User;
  setUserData: (uid: string, username: string, avatar: string) => void;
  setUserPermissions: (permissions: UserPermission[]) => void;
  loadingUser: boolean;
}

export const UserContext = createContext<UserContextType>({
  user: {
    uid: "",
    username: "",
    avatar: "",
    permissions: [],
  },
  setUserData: (_uid: string, _username: string, _avatar: string) => undefined,
  setUserPermissions: (_permissions: UserPermission[]) => undefined,
  loadingUser: false,
});

export default function UserContextComp({ children }: any) {
  const [user, setUser] = useState<User>({
    uid: "",
    username: "",
    avatar: "",
    permissions: [],
  });
  const [loadingUser, setLoadingUser] = useState(true);

  const app = createFirebaseApp();
  const auth = getAuth(app!);
  const db = getFirestore(app!);

  const setUserData = (uid: string, username: string, avatar: string) => {
    setUser({ uid: uid, username: username, avatar: avatar, permissions: [] });
  };

  const setUserPermissions = (permissions: UserPermission[]) => {
    setUser({
      uid: user.uid,
      username: user.username,
      avatar: user.avatar,
      permissions: permissions,
    });
  };

  useEffect(() => {
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
              permissions: [],
            });
        } else setUser({ uid: "", username: "", avatar: "", permissions: [] });
      } catch (error) {
        console.log("ERROR: unable to get user");
      } finally {
        setLoadingUser(false);
      }
    });

    return () => unsubscriber();
  }, []);

  return (
    <UserContext.Provider
      value={{ user, setUserData, setUserPermissions, loadingUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
