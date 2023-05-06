import { useState, createContext, useContext } from "react";

export interface ChannelContextType {
  channel: {
    id: string;
    name: string;
    idC: string;
    idG: string;
  };
  setChannelData: (id: string, name: string, idC: string) => void;
}

export const ChannelContext = createContext<ChannelContextType>({
  channel: { id: "", name: "", idC: "", idG: "" },
  setChannelData: (_id: string, _name: string, _idC: string) => undefined,
});

export default function ChannelContextComp({ children }: any) {
  const [channel, setChannel] = useState({
    id: "",
    name: "",
    idC: "",
    idG: "H8cO2zBjCyJYsmM4g5fv",
  });

  const setChannelData = (id: string, name: string, idC: string) => {
    setChannel({ id: id, name: name, idC: idC, idG: channel.idG });
  };

  return (
    <ChannelContext.Provider value={{ channel, setChannelData }}>
      {children}
    </ChannelContext.Provider>
  );
}

export const useChannel = () => useContext(ChannelContext);
