import { useState, useEffect, createContext, useContext } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { createFirebaseApp } from "../firebase/clientApp";
import { doc, getDoc, getFirestore } from "firebase/firestore";

export type UserPermission = "MODERATE_MESSAGES";

export type User = {
  uid: string;
  username: string;
  avatar: string;
  tag: string;
  nickname: string;
  permissions: UserPermission[];
};

export interface UserContextType {
  user: User;
  setUserData: (
    uid: string,
    username: string,
    avatar: string,
    tag: string
  ) => void;
  setMemberData: (nickname: string, permissions: UserPermission[]) => void;
  loadingUser: boolean;
}

export const UserContext = createContext<UserContextType>({
  user: {
    uid: "",
    username: "",
    avatar: "",
    tag: "",
    nickname: "",
    permissions: [],
  },
  setUserData: (
    _uid: string,
    _username: string,
    _avatar: string,
    _tag: string
  ) => undefined,
  setMemberData: (_nickname: string, _permissions: UserPermission[]) =>
    undefined,
  loadingUser: false,
});

export default function UserContextComp({ children }: any) {
  const [user, setUser] = useState<User>({
    uid: "",
    username: "",
    avatar: "",
    tag: "",
    nickname: "",
    permissions: [],
  });
  const [loadingUser, setLoadingUser] = useState(true);

  const app = createFirebaseApp();
  const auth = getAuth(app!);
  const db = getFirestore(app!);

  const setUserData = (
    uid: string,
    username: string,
    avatar: string,
    tag: string
  ) => {
    setUser({
      uid: uid,
      username: username,
      avatar: avatar,
      tag: tag,
      permissions: user.permissions,
      nickname: user.nickname,
    });
  };

  const setMemberData = (nickname: string, permissions: UserPermission[]) => {
    let userData = user;
    userData.nickname = nickname;
    userData.permissions = permissions;
    setUser(userData);
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
              tag: docSnap.data().tag ? docSnap.data().tag : "",
              permissions: [],
              nickname: "",
            });
        } else
          setUser({
            uid: "",
            username: "",
            avatar: "",
            tag: "",
            permissions: [],
            nickname: "",
          });
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
      value={{ user, setUserData, setMemberData, loadingUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
