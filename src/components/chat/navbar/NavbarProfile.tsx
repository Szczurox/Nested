import React, { useState } from "react";
import Avatar from "@material-ui/core/Avatar";
import MicIcon from "@material-ui/icons/Mic";
import HeadsetIcon from "@material-ui/icons/Headset";
import SettingsIcon from "@material-ui/icons/Settings";
import styles from "../../../styles/components/chat/navbar/NavbarProfile.module.scss";
import { useUser } from "context/userContext";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { createFirebaseApp } from "../../../firebase/clientApp";
import { doc, getFirestore, updateDoc } from "firebase/firestore";

export const NavbarProfile: React.FC = ({}) => {
  const { user, setUserData } = useUser();

  const [avatar, setAvatar] = useState(
    user.avatar != ""
      ? user.avatar
      : "https://www.pngall.com/wp-content/uploads/5/User-Profile-PNG-High-Quality-Image.png"
  );

  const storage = getStorage();
  const app = createFirebaseApp();
  const db = getFirestore(app!);

  async function fileSubmit(url: string) {
    await updateDoc(doc(db, "profile", user.uid), {
      avatar: url,
    });
  }

  const uploadAvatar = (file: File) => {
    if (file.type.substring(0, 5) == "image") {
      const fileRef = ref(storage, `profiles/${user.uid}`);
      const uploadTask = uploadBytesResumable(fileRef, file!);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");
          switch (snapshot.state) {
            case "paused":
              console.log("Upload is paused");
              break;
            case "running":
              console.log("Upload is running");
              break;
          }
        },
        (error) => {
          console.log(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            console.log("File uploaded! ", downloadURL);
            fileSubmit(downloadURL).then(() => {
              setAvatar(downloadURL);
              setUserData(user.uid, user.username, downloadURL, user.tag);
            });
          });
        }
      );
    }
  };

  return (
    <div className={styles.navbar_profile}>
      <div className={styles.navbar_avatar}>
        <Avatar src={avatar} />
        <input
          type="file"
          value=""
          className={styles.navbar_upload_avatar}
          onChange={(e) => {
            if (e.target.files) uploadAvatar(e.target.files[0]);
          }}
        />
      </div>
      <div className={styles.navbar_profileInfo}>
        <h3>{user.username}</h3>
        <p>@{user.tag}</p>
      </div>
      <div className={styles.navbar_profileIcons}>
        <MicIcon />
        <HeadsetIcon />
        <SettingsIcon />
      </div>
    </div>
  );
};
