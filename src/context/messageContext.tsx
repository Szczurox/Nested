import { useState, createContext, useContext } from "react";

export interface MessageContextType {
  message: {
    id: string;
  };
  setCurrentMessage: (id: string) => void;
}

export const MessageContext = createContext<MessageContextType | null>(null);

export default function MessageContextComp({ children }: any) {
  const [message, setMessage] = useState({ id: "" });

  const setCurrentMessage = (id: string) => {
    setMessage({ id: id });
  };

  return (
    <MessageContext.Provider value={{ message, setCurrentMessage }}>
      {children}
    </MessageContext.Provider>
  );
}

export const useMessage = () => useContext(MessageContext);
