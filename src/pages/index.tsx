import type { NextPage } from "next";
import Link from "next/link";

const Home: NextPage = () => {
  return (
    <div className="container">
      <Link href="/login">
        <button>LOGIN</button>
      </Link>
      <Link href="/register">
        <button>REGISTER</button>
      </Link>
      <Link href="/chat">
        <button>CHAT</button>
      </Link>
    </div>
  );
};

export default Home;
