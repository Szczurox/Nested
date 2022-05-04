import { useState, createContext, useContext } from "react";

export const ChannelContext = createContext(undefined as any);

export default function ChannelContextComp({ children }: any) {
  const [channel, setChannel] = useState({ id: "", name: "", idC: "" });

  return (
    <ChannelContext.Provider value={{ channel, setChannel }}>
      {children}
    </ChannelContext.Provider>
  );
}

export const useChannel = () => useContext(ChannelContext);
