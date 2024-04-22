import { TextareaAutosize } from "@material-ui/core";
import React, { useEffect, useRef, useState } from "react";
import UploadFile, { FileUploadingData } from "./UploadFile";
import styles from "../../styles/components/chat/ChatInput.module.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import SendIcon from "@mui/icons-material/Send";
import GifIcon from "@material-ui/icons/Gif";
import { createFirebaseApp } from "../../firebase-utils/clientApp";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";
import { useChannel } from "context/channelContext";
import { useUser } from "context/userContext";
import { usePopUp } from "context/popUpContext";
import Emoji from "./ui-icons/Emoji";
import InformationPopUp from "./popup/InformationPopUp";
import { wait } from "components/utils/utils";

interface ChatInputProps {
  isDisabled: boolean;
  isMobile: boolean;
  isTyping: boolean;
  fileUploading: (fileData: FileUploadingData) => void;
  setIsTyping: (typing: boolean) => void;
  scrollToBottom: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  isDisabled,
  isMobile,
  isTyping,
  fileUploading,
  setIsTyping,
  scrollToBottom,
}) => {
  const [inputOnChannels, setInputOnChannels] = useState<[string, string][]>([
    ["", ""],
  ]);
  const [input, setInput] = useState<string>(""); // Textarea input
  const [emojiBucket, setEmojiBucket] = useState<string[]>([]); // Array of all the emoji name|link used in the message
  const [emojis, setEmojis] = useState<string[]>([]); // Array of all saved samojis
  const [slowDownCount, setSlowDownCount] = useState<number>(0); // Show Slow Down pop-up if reaches 2
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout>(
    setTimeout(() => null, 0)
  );

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const { channel } = useChannel();
  const { user } = useUser();
  const { popUp } = usePopUp();

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  const messagesCollection = collection(
    db,
    "groups",
    channel.idG,
    "channels",
    channel.id ? channel.id : "None",
    "messages"
  );

  const participantsCollection = collection(
    db,
    "groups",
    channel.idG,
    "channels",
    channel.id ? channel.id : "None",
    "participants"
  );

  const textAreaSizeLimit = 2000;

  useEffect(() => {
    setInputOnChannels((inputs) => [
      ...inputs.filter((el) => el[0] != channel.id),
      [channel.id, input],
    ]);
  }, [input]);

  useEffect(() => {
    var element = inputOnChannels.find((el) => el[0] == channel.id);
    if (element) setInput(element[1]);
    else setInput("");
  }, [channel.id]);

  useEffect(() => {
    document.addEventListener("paste", pasted);
    return () => {
      document.removeEventListener("paste", pasted);
    };
  }, [input, popUp.isOpen, channel.id]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [popUp.isOpen]);

  const pasted = (e: ClipboardEvent) => {
    if (
      e.clipboardData!.files[0] == undefined &&
      channel.id != "" &&
      !popUp.isOpen &&
      document.activeElement?.tagName != "TEXTAREA"
    ) {
      console.log("ROLF");
      let text: string = e.clipboardData!.getData("TEXT");
      getEmojis(text);
      textAreaRef.current?.focus();
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (
      document.activeElement?.tagName != "TEXTAREA" &&
      !popUp.isOpen &&
      textAreaRef.current &&
      ((e.ctrlKey && e.code == "KeyA") || !e.ctrlKey)
    )
      textAreaRef.current.focus();
  };

  async function sendMessage() {
    // Get current input and reset textarea instantly, before message gets fully sent
    const chatInput = input.replace(/^\s+|\s+$/g, "");
    if (input.includes(":>") && input.includes("<:")) await getEmojis(input);
    setInput("");
    if (chatInput.length) {
      setInput("");
      await updateDoc(doc(db, "groups", channel.idG, "channels", channel.id), {
        lastMessageAt: serverTimestamp(),
      }).catch((err) => console.log("Update lastMessagedAt Error: " + err));

      await addDoc(messagesCollection, {
        content: chatInput,
        userid: user.uid,
        createdAt: serverTimestamp(),
        edited: false,
        emojiBucket: arrayUnion(...emojiBucket),
      })
        .catch((err) => {
          console.log(err);
          // Create rejection is surely caused by trying to send too many messages
          setSlowDownCount(slowDownCount + 1);
        })
        .then((_) => scrollToBottom());

      // Update the time at which the last message was sent by the user
      // Rate limit user
      await updateDoc(doc(db, "profile", user.uid), {
        lastMessagedAt: serverTimestamp(),
      }).catch((err) => {
        console.log(err);
      });

      setEmojiBucket([]);
    }
  }

  async function sendMessageMobile() {
    userTyping();
    if (slowDownCount > 1 || popUp.isOpen) {
      // Don't update input if sending messages too quickly or pop-up is open
      textAreaRef.current!.blur();
    } else if (channel.id != "") {
      sendMessage();
    }
  }

  async function userTyping() {
    if (!isTyping) {
      clearTimeout(typingTimeout);

      setIsTyping(true);
      await updateDoc(doc(participantsCollection, user.uid), {
        lastTyping: serverTimestamp(),
      });

      setTypingTimeout(
        setTimeout(async () => {
          setIsTyping(false);
        }, 5000)
      );
    }
  }

  async function checkMessage(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    userTyping();
    await getEmojis(input);
    if (slowDownCount > 1 || popUp.isOpen) {
      // Don't update input if sending messages too quickly or pop-up is open
      e.preventDefault();
      textAreaRef.current!.blur();
    } else if (
      e.key == "Enter" &&
      e.shiftKey == false &&
      channel.id != "" &&
      !isMobile
    ) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function getEmojis(text: string) {
    if (text.includes(":>") && text.includes("<:")) {
      const emojiCollection = collection(db, "groups", channel.idG, "emoji");
      const emojiSplit = text.split(/(<:.*?:>+)/g);
      emojiSplit.forEach(async (el) => {
        if (el.startsWith("<:") && el.endsWith(":>") && el.includes("?")) {
          let element = emojis.find((e) => e.split("|")[0] == el);
          if (!element) {
            const name = el.split("?")[0].slice(2);
            const doc = await getDocs(
              query(emojiCollection, where("name", "==", name))
            );
            const file = doc.docs[0].data().file;
            setEmojis([...emojis, el + "|" + file]);
            setEmojiBucket((emojiBucket) => [...emojiBucket, el + "|" + file]);
          } else {
            setEmojiBucket([...emojiBucket, element]);
          }
        }
      });
    }
  }

  const addedEmoji = (text: string, file: string) => {
    if ((input + text).length <= textAreaSizeLimit) {
      textAreaRef.current!.focus();
      setInput(input + text);
      if (!emojiBucket.find((el) => el[0] == text))
        setEmojiBucket((emojiBucket) => [...emojiBucket, text + "|" + file]);
    }
  };

  const uploadFile = (fileData: FileUploadingData) => {
    if (fileData.percent == 0) setInput("");
    fileUploading(fileData);
  };

  return (
    <div className={styles.chat_input}>
      {slowDownCount > 1 ? (
        <InformationPopUp
          onOk={() => wait(1500).then(() => setSlowDownCount(0))}
        >
          <h3>Slow down!</h3>
          <p>You are trying to send messages too quickly.</p>
        </InformationPopUp>
      ) : null}
      {!isDisabled ? (
        <UploadFile chatInput={input} uploadCallback={uploadFile} />
      ) : null}
      <form>
        <TextareaAutosize
          value={input}
          wrap="soft"
          maxLength={2000}
          maxRows={input ? (isMobile ? 4 : 10) : 1}
          disabled={channel.id == "" || isDisabled || channel.idG == "@dms"}
          onChange={(e) => setInput(e.target.value)}
          onPaste={(e) => getEmojis(e.clipboardData!.getData("TEXT"))}
          onKeyDown={checkMessage}
          placeholder={
            !isDisabled
              ? `Message #${channel.name}`
              : `You don't have permission to message #${channel.name}`
          }
          ref={textAreaRef}
        />
        <button
          disabled={channel.id == "" || !isDisabled}
          className={styles.chat_input_button}
          type="submit"
        ></button>
      </form>
      <div className={styles.chat_input_icons}>
        <GifIcon fontSize="large" className={styles.chat_input_icon} />
        <Emoji enabled={channel.id != ""} emojiAdded={addedEmoji} />
        {isMobile && input != "" ? (
          <SendIcon
            className={styles.chat_input_icon}
            onClick={() => sendMessageMobile()}
          />
        ) : null}
      </div>
    </div>
  );
};
