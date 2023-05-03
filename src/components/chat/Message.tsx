import React, { ReactNode, useEffect, useState } from "react";
import { Avatar } from "@material-ui/core";
import style from "../../styles/components/chat/Message.module.scss";
import moment from "moment";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { createFirebaseApp } from "../../firebase/clientApp";

interface MessageProps {
  id: string;
  content: string;
  userid: string;
  file?: string;
  time?: string;
  children?: ReactNode;
  onImageLoad?: () => void;
}

export interface MessageData {
  id: string;
  content: string;
  timestamp: string;
  uid: string;
  file?: string;
}

export const Message: React.FC<MessageProps> = ({
  id,
  content,
  time,
  file,
  userid = "uid",
  children,
  onImageLoad,
}) => {
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(
    "https://www.pngall.com/wp-content/uploads/5/User-Profile-PNG-High-Quality-Image.png"
  );

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  useEffect(() => {
    async function getUserData() {
      const docSnap = await getDoc(doc(db, "profile", userid));
      if (docSnap.exists()) {
        setUsername(docSnap.data().username);
        if (docSnap.data().avatar) setAvatar(docSnap.data().avatar);
      }
    }
    getUserData();
  });

  return username ? (
    <div className={style.message} id={id}>
      <div className={style.message_info}>
        <div className={style.message_profilePicture}>
          <Avatar style={{ height: "45px", width: "45px" }} src={avatar} />
        </div>
        <h4>
          {username}
          <span className={style.message_timestamp}>
            {moment(time).local().format("MMMM Do YYYY [at] hh:mm a")}
          </span>
        </h4>
        {content && (
          <div className={style.message_content}>
            <p>{content}</p>
          </div>
        )}
        {file && (
          <div className={style.message_embed}>
            <a href={file} target="_blank" rel="noreferrer">
              <img
                className={
                  content ? style.message_image_text : style.message_image
                }
                src={file}
                alt="image"
                onLoad={(_) => (onImageLoad ? onImageLoad() : null)}
              />
            </a>
          </div>
        )}
        {children}
      </div>
    </div>
  ) : (
    <div></div>
  );
};

export default Message;
