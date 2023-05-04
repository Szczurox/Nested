import React from "react";

export const Loading: React.FC = ({}) => {
  return (
    <div id="globalLoader">
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/a/ad/YouTube_loading_symbol_3_%28transparent%29.gif"
        alt="loading"
        width="50vw"
        height="50vh"
      />
    </div>
  );
};
export default Loading;
