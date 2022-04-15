import "../styles/globals.scss";
import type { AppProps } from "next/app";
import UserProvider from "../context/userContext";
import ChannelProvider from "../context/channelContext";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <ChannelProvider>
        <Component {...pageProps} />
      </ChannelProvider>
    </UserProvider>
  );
}

export default MyApp;
