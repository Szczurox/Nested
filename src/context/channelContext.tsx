import { useState, createContext, useContext } from "react";

export interface ChannelContextType {
  channel: {
    id: string; // Channel ID
    name: string; // Channel name
    idC: string; // Category ID
    nameC: string; // Category name
    idG: string; // Group ID
    voiceId: string; // Voice or text channel
  };
  setChannelData: (
    id: string,
    name: string,
    idC: string,
    nameC: string
  ) => void;

  setChannelVoice: (_voiceId: string) => void;
}

export const ChannelContext = createContext<ChannelContextType>({
  channel: {
    id: "",
    name: "",
    idC: "",
    nameC: "",
    idG: "",
    voiceId: "",
  },
  setChannelData: (_id: string, _name: string, _idC: string, _nameC: string) =>
    undefined,

  setChannelVoice: (_voiceId: string) => undefined,
});

export default function ChannelContextComp({ children }: any) {
  const [channel, setChannel] = useState({
    id: "",
    name: "",
    idC: "",
    nameC: "",
    idG: "H8cO2zBjCyJYsmM4g5fv",
    voiceId: "",
  });

  const setChannelData = (
    id: string,
    name: string,
    idC: string,
    nameC: string
  ) => {
    setChannel({
      id: id,
      name: name,
      idC: idC,
      nameC: nameC,
      idG: channel.idG,
      voiceId: channel.voiceId,
    });
  };

  const setChannelVoice = (voiceId: string) => {
    setChannel({
      id: channel.id,
      name: channel.name,
      idC: channel.idC,
      nameC: channel.nameC,
      idG: channel.idG,
      voiceId: voiceId,
    });
  };

  return (
    <ChannelContext.Provider
      value={{ channel, setChannelData, setChannelVoice }}
    >
      {children}
    </ChannelContext.Provider>
  );
}

export const useChannel = () => useContext(ChannelContext);
