import { useState, createContext, useContext } from "react";

export interface ChannelContextType {
  channel: {
    id: string;
    name: string;
    idC: string;
  };
  setChannelData: (id: string, name: string, idC: string) => void;
}

export const ChannelContext = createContext<ChannelContextType>({
  channel: { id: "", name: "", idC: "" },
  setChannelData: (id: string, name: string, idC: string) => undefined,
});

export default function ChannelContextComp({ children }: any) {
  const [channel, setChannel] = useState({ id: "", name: "", idC: "" });

  const setChannelData = (id: string, name: string, idC: string) => {
    setChannel({ id: id, name: name, idC: idC });
  };

  return (
    <ChannelContext.Provider value={{ channel, setChannelData }}>
      {children}
    </ChannelContext.Provider>
  );
}

export const useChannel = () => useContext(ChannelContext);
