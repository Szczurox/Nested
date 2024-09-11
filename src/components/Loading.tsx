import React from "react";
import DotsLoading from "./animations/DotsLoading";

export const Loading: React.FC = ({}) => {
	return (
		<div id="globalLoader">
			<DotsLoading />
		</div>
	);
};
export default Loading;
