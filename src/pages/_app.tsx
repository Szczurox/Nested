import "../styles/globals.scss";
import UserProvider from "../context/userContext";
import ChannelProvider from "../context/channelContext";
import PopUpProvider from "../context/popUpContext";
import MessageProvider from "../context/messageContext";
import VoiceProvider from "../context/voiceContext";
import { AppProps } from "next/dist/shared/lib/router/router";
import { useEffect, useState } from "react";

function MyApp({ Component, pageProps, router }: AppProps) {
	const [windowHeight, setWindowHeight] = useState<number>(0);

	useEffect(() => {
		const handleResize = () => {
			setWindowHeight(window.innerHeight);
		};

		handleResize();
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	useEffect(() => {
		const checkForZoom = (e: any) => {
			if (e.ctrlKey && (e.key == "+" || e.key == "-" || e.key == "=")) {
				e.preventDefault();
			}
		};

		const checkForZoomScroll = (e: any) => {
			if (e.ctrlKey) {
				e.preventDefault();
				return false;
			}
		};

		const handleContextMenu = (e: Event) => e.preventDefault();

		document.addEventListener("contextmenu", handleContextMenu);
		document.addEventListener("keydown", checkForZoom);
		document.addEventListener("wheel", checkForZoomScroll, {
			passive: false,
		});
		return () => {
			document.removeEventListener("contextmenu", handleContextMenu);
			document.removeEventListener("keydown", checkForZoom);
			document.removeEventListener("wheel", checkForZoomScroll);
		};
	}, [router.events]);

	return (
		<UserProvider>
			<ChannelProvider>
				<VoiceProvider>
					<MessageProvider>
						<PopUpProvider>
							<div style={{ height: windowHeight }}>
								<title>Nested</title>
								<meta
									name="viewport"
									content="initial-scale=1, maximum-scale=1.0, user-scalable=no"
								/>
								<link rel="icon" href="/favicon.ico" />
								<meta name="Nested" content="Chat App" />
								<Component {...pageProps} />
							</div>
						</PopUpProvider>
					</MessageProvider>
				</VoiceProvider>
			</ChannelProvider>
		</UserProvider>
	);
}

export default MyApp;
