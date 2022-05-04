import "../styles/globals.scss";
import type { AppProps } from "next/app";
import UserProvider from "../context/userContext";
import ChannelProvider from "../context/channelContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Loading from "components/Loading";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = (url: any) => {
      url !== router.pathname ? setLoading(true) : setLoading(false);
    };
    const handleComplete = (url: any) => setLoading(false);

    console.log(loading);
    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);
  }, [router, loading]);

  return (
    <UserProvider>
      <ChannelProvider>
        {loading ? <Loading loading={loading} /> : <Component {...pageProps} />}
      </ChannelProvider>
    </UserProvider>
  );
}

export default MyApp;
