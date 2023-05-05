import "../styles/globals.scss";
import UserProvider from "../context/userContext";
import ChannelProvider from "../context/channelContext";
import MessageProvider from "../context/messageContext";
import { AppProps } from "next/dist/shared/lib/router/router";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <ChannelProvider>
        <MessageProvider>
          <Component {...pageProps} />
        </MessageProvider>
      </ChannelProvider>
    </UserProvider>
  );
}

export default MyApp;
