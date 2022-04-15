import { useState, createContext, useContext } from "react";

const ChannelContext = createContext(undefined as any);

export default function ChannelContextComp({ children }: any) {
  const [channel, setChannel] = useState({ id: "" });

  return (
    <ChannelContext.Provider value={{ channel, setChannel }}>
      {children}
    </ChannelContext.Provider>
  );
}

export const useChannel = () => useContext(ChannelContext);
