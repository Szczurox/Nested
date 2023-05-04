import "../styles/globals.scss";
import UserProvider from "../context/userContext";
import ChannelProvider from "../context/channelContext";
import { AppProps } from "next/dist/shared/lib/router/router";

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
