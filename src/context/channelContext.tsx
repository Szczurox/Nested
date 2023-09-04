import { useState, createContext, useContext } from "react";

export interface ChannelContextType {
  channel: {
    id: string; // Channel ID
    name: string; // Channel name
    idC: string; // Category ID
    nameC: string; // Category name
    idG: string; // Group ID
  };
  setChannelData: (
    id: string,
    name?: string,
    idC?: string,
    nameC?: string
  ) => void;
  setGroupData: (
    idG: string,
    id?: string,
    name?: string,
    idC?: string,
    nameC?: string
  ) => void;
}

export const ChannelContext = createContext<ChannelContextType>({
  channel: {
    id: "",
    name: "",
    idC: "",
    nameC: "",
    idG: "",
  },
  setChannelData: (
    _id: string,
    _name?: string,
    _idC?: string,
    _nameC?: string
  ) => undefined,
  setGroupData: (
    _idG: string,
    _id?: string,
    _name?: string,
    _idC?: string,
    _nameC?: string
  ) => undefined,
});

export default function ChannelContextComp({ children }: any) {
  const [channel, setChannel] = useState({
    id: "",
    name: "",
    idC: "",
    nameC: "",
    idG: "H8cO2zBjCyJYsmM4g5fv",
  });

  const setChannelData = (
    id: string,
    name?: string,
    idC?: string,
    nameC?: string
  ) => {
    setChannel({
      id: id,
      name: name ? name : channel.name,
      idC: idC ? idC : channel.idC,
      nameC: nameC ? nameC : channel.nameC,
      idG: channel.idG,
    });
  };

  const setGroupData = (
    idG: string,
    id?: string,
    name?: string,
    idC?: string,
    nameC?: string
  ) => {
    setChannel({
      id: id ? id : channel.id,
      name: name ? name : channel.name,
      idC: idC ? idC : channel.idC,
      nameC: nameC ? nameC : channel.nameC,
      idG: idG,
    });
  };

  return (
    <ChannelContext.Provider value={{ channel, setChannelData, setGroupData }}>
      {children}
    </ChannelContext.Provider>
  );
}

export const useChannel = () => useContext(ChannelContext);
