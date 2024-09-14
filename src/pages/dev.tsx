import React from "react";
import Link from "next/link";

const Chat = () => {
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
			<Link href="/signout">
				<button>SIGN OUT</button>
			</Link>
		</div>
	);
};

export default Chat;
