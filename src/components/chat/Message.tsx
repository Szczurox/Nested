import React from "react";
import { Avatar, TextareaAutosize } from "@material-ui/core";
import style from "../../styles/components/chat/Message.module.scss";

export const Message: React.FC = () => {
  return (
    <div className={style.message}>
      <div className={style.message_info}>
        <div className={style.message_profilePicture}>
          <Avatar
            style={{ height: "45px", width: "45px" }}
            src="https://avatars.githubusercontent.com/u/58273015?s=48"
          />
        </div>
        <h4>
          Name
          <span className={style.message_timestamp}>2342342342342</span>
        </h4>
        <div className="message_content">
          <p>ass</p>
        </div>
      </div>
    </div>
  );
};

export default Message;
