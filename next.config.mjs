/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
	reactStrictMode: false,
	sassOptions: {
		includePaths: [path.join(__dirname, "src/styles")],
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "firebasestorage.googleapis.com",
				port: "",
				pathname: "/**",
			},
		],
	},
};

export default config;
