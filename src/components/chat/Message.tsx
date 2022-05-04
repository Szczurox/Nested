import React from "react";
import { Avatar, TextareaAutosize } from "@material-ui/core";
import style from "../../styles/components/chat/Message.module.scss";

interface MessageProps {
  id: string;
  content: string;
  username?: string;
  timestamp?: string;
}

export const Message: React.FC<MessageProps> = ({
  id,
  content,
  timestamp,
  username = "Username",
}) => {
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
          <span className={style.message_timestamp}>{timestamp}</span>
        </h4>
        <div className="message_content">
          <p>{content}</p>
        </div>
      </div>
    </div>
  );
};

export default Message;
