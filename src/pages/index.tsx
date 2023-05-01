import type { NextPage } from "next";
import { useEffect } from "react";
import { useUser } from "context/userContext";
import { useRouter } from "next/router";

const Home: NextPage = () => {
  const { user, loadingUser } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Route to login if user is not authenticated
    if (user.uid == "" && !loadingUser) router.push("/login");
    // Else route to chat
    else router.push("/chat");
  });

  return <div></div>;
};

export default Home;
