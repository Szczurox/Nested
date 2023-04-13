import React, { useState } from "react";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import styles from "../../styles/components/chat/UploadFile.module.scss";
import { v4 } from "uuid";
import {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
} from "firebase/storage";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import { useChannel } from "context/channelContext";
import { useUser } from "context/userContext";
import moment from "moment";
import { createFirebaseApp } from "../../firebase/clientApp";

export const UploadFile: React.FC<{
  chatInput?: string;
  disabled?: boolean;
}> = ({ chatInput, disabled = false }) => {
  const [input, setInput] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileG, setFileG] = useState<File>();
  const [isOpen, setIsOpen] = useState(false);
  const { channel } = useChannel();
  const { user } = useUser();
  const storage = getStorage();
  const app = createFirebaseApp();
  const db = getFirestore(app!);

  async function checkFile(e: File) {
    console.log(e.type);
    if (e.type.substring(0, 5) == "image") {
      console.log("valid");
      if (chatInput) setInput(chatInput);
      setFileG(e);
      setFileName(e.name);
      setFileUrl(URL.createObjectURL(e));
      setIsOpen(true);
      const file = e;
      const fileRef = ref(storage, `images/${v4()}/${file!.name}`);
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
            fileSubmit(downloadURL);
          });
        }
      );
    }
  }

  const uploadFile = () => {
    const file = fileG;
    setIsOpen(false);
    const fileRef = ref(storage, v4());
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
          fileSubmit(downloadURL);
        });
      }
    );
  };

  async function fileSubmit(url: string) {
    console.log(fileName);
    input.replace(/\s/g, "");
    console.log(channel.idC, channel.id, url, input);
    await addDoc(
      collection(
        db,
        "groups",
        "H8cO2zBjCyJYsmM4g5fv",
        "categories",
        channel.idC,
        "channels",
        channel.id,
        "messages"
      ),
      {
        createdAt: serverTimestamp(),
        time: moment().utcOffset("+00:00").format(),
        content: input,
        userid: user.uid,
        file: url,
      }
    );
    setInput("");
  }

  return (
    <div className={styles.uploadFile}>
      <form>
        <div className={styles.uploadFile_file}>
          <AddCircleIcon fontSize="large" />
          <input
            type="file"
            value=""
            className={styles.uploadFile_uploadFile}
            onChange={(e) => {
              if (e.target.files) checkFile(e.target.files[0]);
            }}
            disabled={disabled}
          />
        </div>
      </form>
    </div>
  );
};

export default UploadFile;
