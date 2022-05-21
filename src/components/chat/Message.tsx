import React, { useEffect, useState } from "react";
import { Avatar, TextareaAutosize } from "@material-ui/core";
import style from "../../styles/components/chat/Message.module.scss";
import moment from "moment";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { createFirebaseApp } from "../../firebase/clientApp";

interface MessageProps {
  id: string;
  content: string;
  userid: string;
  time?: string;
}

export const Message: React.FC<MessageProps> = ({
  id,
  content,
  time,
  userid = "Username",
}) => {
  const [username, setUsername] = useState("");

  const app = createFirebaseApp();
  const db = getFirestore(app);

  useEffect(() => {
    async function getUserData() {
      const docSnap = await getDoc(doc(db, "profile", userid));
      if (docSnap.exists()) setUsername(docSnap.data().username);
    }
    getUserData();
  });

  return (
    <div className={style.message} id={id}>
      <div className={style.message_info}>
        <div className={style.message_profilePicture}>
          <Avatar
            style={{ height: "45px", width: "45px" }}
            src="https://avatars.githubusercontent.com/u/58273015?s=48"
          />
        </div>
        <h4>
          {username}
          <span className={style.message_timestamp}>
            {moment(time).local().format("MMMM Do YYYY [at] hh:mm:ss a")}
          </span>
        </h4>
        <div className="message_content">
          <p>{content}</p>
        </div>
      </div>
    </div>
  );
};

export default Message;
