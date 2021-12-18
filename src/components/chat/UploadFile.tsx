import React from "react";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import styles from "../../styles/components/chat/UploadFile.module.scss";

export const UploadFile: React.FC = ({}) => {
  return (
    <div className={styles.uploadFile}>
      <form>
        <div className={styles.uploadFile_file}>
          <AddCircleIcon fontSize="large" />
          <input
            type="file"
            value=""
            className={styles.uploadFile_uploadFile}
            onChange={(e) => console.log(e)}
            disabled={false}
          />
        </div>
      </form>
    </div>
  );
};

export default UploadFile;
