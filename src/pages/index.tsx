import type { NextPage } from "next";
import Link from "next/link";
import { getAuth, signOut } from "firebase/auth";

const Home: NextPage = () => {
  const logOut = async () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        alert("signed out");
      })
      .catch((error) => {
        console.log("SIGN OUT ERROR: " + error.message);
      });
  };

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
      <button onClick={logOut}>SIGN OUT</button>
    </div>
  );
};

export default Home;
