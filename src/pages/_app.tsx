import "../styles/globals.scss";
import UserProvider from "../context/userContext";
import ChannelProvider from "../context/channelContext";
import { useEffect } from "react";
import { AppProps } from "next/dist/shared/lib/router/router";

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    async function loading() {
      if (typeof window !== "undefined") {
        const loader = document.getElementById("globalLoader");
        if (loader) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          loader.remove();
        }
      }
    }
    loading();
  });

  return (
    <UserProvider>
      <ChannelProvider>
        <div id="globalLoader">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/a/ad/YouTube_loading_symbol_3_%28transparent%29.gif"
            alt="loading"
            width="50vw"
            height="50vh"
          />
        </div>
        <Component {...pageProps} />
      </ChannelProvider>
    </UserProvider>
  );
}

export default MyApp;
