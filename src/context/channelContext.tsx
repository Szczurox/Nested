import { useState, createContext, useContext } from "react";

export type ChannelType = "voice" | "text";

export interface ChannelContextType {
  channel: {
    id: string; // Channel ID
    name: string; // Channel name
    idC: string; // Category ID
    nameC: string; // Category name
    idG: string; // Group ID
    channelType: ChannelType; // Voice or text channel
  };
  setChannelData: (
    id: string,
    name: string,
    idC: string,
    nameC: string,
    channelType: ChannelType
  ) => void;
}

export const ChannelContext = createContext<ChannelContextType>({
  channel: {
    id: "",
    name: "",
    idC: "",
    nameC: "",
    idG: "",
    channelType: "text",
  },
  setChannelData: (
    _id: string,
    _name: string,
    _idC: string,
    _nameC: string,
    _channelType: ChannelType
  ) => undefined,
});

export default function ChannelContextComp({ children }: any) {
  const [channel, setChannel] = useState({
    id: "",
    name: "",
    idC: "",
    nameC: "",
    idG: "H8cO2zBjCyJYsmM4g5fv",
    channelType: "text" as ChannelType,
  });

  const setChannelData = (
    id: string,
    name: string,
    idC: string,
    nameC: string,
    channelType: ChannelType
  ) => {
    setChannel({
      id: id,
      name: name,
      idC: idC,
      nameC: nameC,
      idG: channel.idG,
      channelType: channelType,
    });
  };

  return (
    <ChannelContext.Provider value={{ channel, setChannelData }}>
      {children}
    </ChannelContext.Provider>
  );
}

export const useChannel = () => useContext(ChannelContext);
