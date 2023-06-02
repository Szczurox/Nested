import { useState, useEffect, createContext, useContext } from "react";
import { getAuth, getIdToken, onAuthStateChanged } from "firebase/auth";
import { createFirebaseApp } from "../firebase-utils/clientApp";
import { doc, getDoc, getFirestore } from "firebase/firestore";

export type MemberPermission =
  | "MODERATE_MESSAGES"
  | "MANAGE_CHANNELS"
  | "SEND_MESSAGES"
  | "VIEW_CHANNEL";

export type ParticipantPermission = "SEND_MESSAGES" | "VIEW_CHANNEL";

export type User = {
  token: string;
  uid: string;
  username: string;
  avatar: string;
  tag: string;
  nickname: string;
  permissions: MemberPermission[];
  partPermissions: ParticipantPermission[];
};

export interface UserContextType {
  user: User;
  setUserData: (
    token: string,
    uid: string,
    username: string,
    avatar: string,
    tag: string
  ) => void;
  setMemberData: (nickname: string, permissions: MemberPermission[]) => void;
  addPartPerms: (permissions: ParticipantPermission[]) => void;
  loadingUser: boolean;
}

export const UserContext = createContext<UserContextType>({
  user: {
    token: "",
    uid: "",

    username: "",
    avatar: "",
    tag: "",
    nickname: "",
    permissions: [],
    partPermissions: [],
  },
  setUserData: (
    _uid: string,
    _username: string,
    _avatar: string,
    _tag: string
  ) => undefined,
  setMemberData: (_nickname: string, _permissions: MemberPermission[]) =>
    undefined,
  addPartPerms: (_permissions: ParticipantPermission[]) => undefined,
  loadingUser: false,
});

export default function UserContextComp({ children }: any) {
  const [user, setUser] = useState<User>({
    token: "",
    uid: "",
    username: "",
    avatar: "",
    tag: "",
    nickname: "",
    permissions: [],
    partPermissions: [],
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
      ...user,
      uid: uid,
      username: username,
      avatar: avatar,
      tag: tag,
    });
  };

  const setMemberData = (nickname: string, permissions: MemberPermission[]) => {
    setUser({
      ...user,
      permissions: permissions,
      nickname: nickname,
    });
  };

  const setPartPerms = (permissions: ParticipantPermission[]) => {
    setUser({
      ...user,
      partPermissions: permissions,
    });
  };

  useEffect(() => {
    const unsubscriber = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const uid = user.uid;
          const docSnap = await getDoc(doc(db, "profile", uid));
          const token = await getIdToken(user);
          if (docSnap.exists())
            setUser({
              token: token,
              uid: uid,
              username: docSnap.data().username,
              avatar: docSnap.data().avatar ? docSnap.data().avatar : "",
              tag: docSnap.data().tag ? docSnap.data().tag : "",
              nickname: "",
              permissions: [],
              partPermissions: [],
            });
        } else
          setUser({
            token: "",
            uid: "",
            username: "",
            avatar: "",
            tag: "",
            nickname: "",
            permissions: [],
            partPermissions: [],
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
      value={{
        user,
        setUserData,
        setMemberData,
        addPartPerms: setPartPerms,
        loadingUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
