import "../styles/globals.scss";
import UserProvider from "../context/userContext";
import ChannelProvider from "../context/channelContext";
import PopUpProvider from "../context/popUpContext";
import MessageProvider from "../context/messageContext";
import { AppProps } from "next/dist/shared/lib/router/router";
import { useEffect, useState } from "react";
import Loading from "components/Loading";

function MyApp({ Component, pageProps, router }: AppProps) {
	const [isRouteChanging, setIsRouteChanging] = useState<boolean>(false);
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
		const routeChangeStartHandler = () => setIsRouteChanging(true);

		const routeChangeEndHandler = () => setIsRouteChanging(false);

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
		router.events.on("routeChangeStart", routeChangeStartHandler);
		router.events.on("routeChangeComplete", routeChangeEndHandler);
		router.events.on("routeChangeError", routeChangeEndHandler);
		return () => {
			document.removeEventListener("contextmenu", handleContextMenu);
			document.removeEventListener("keydown", checkForZoom);
			document.removeEventListener("wheel", checkForZoomScroll);
			router.events.off("routeChangeStart", routeChangeStartHandler);
			router.events.off("routeChangeComplete", routeChangeEndHandler);
			router.events.off("routeChangeError", routeChangeEndHandler);
		};
	}, [router.events]);
	return (
		<>
			<meta
				name="viewport"
				content="initial-scale=1, maximum-scale=1.0, user-scalable=no"
			/>
			<UserProvider>
				<ChannelProvider>
					<MessageProvider>
						<PopUpProvider>
							<div style={{ height: windowHeight }}>
								{isRouteChanging ? (
									<Loading />
								) : (
									<Component {...pageProps} />
								)}
							</div>
						</PopUpProvider>
					</MessageProvider>
				</ChannelProvider>
			</UserProvider>
		</>
	);
}

export default MyApp;
