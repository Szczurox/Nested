import Image from "next/image";
import React from "react";

export const Loading: React.FC = ({}) => {
	return (
		<div id="globalLoader">
			<Image
				src="/loading.gif"
				alt="loading"
				width={50}
				height={50}
				unoptimized
			/>
		</div>
	);
};
export default Loading;
