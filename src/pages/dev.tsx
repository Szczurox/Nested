import React from "react";
import { getAuth, signOut } from "firebase/auth";
import Link from "next/link";

const Chat = () => {
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
			<Link href="/login" passHref>
				<button>LOGIN</button>
			</Link>
			<Link href="/register" passHref>
				<button>REGISTER</button>
			</Link>
			<Link href="/chat" passHref>
				<button>CHAT</button>
			</Link>
			<button onClick={logOut}>SIGN OUT</button>
		</div>
	);
};

export default Chat;
