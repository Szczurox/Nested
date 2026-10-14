import { buildApp } from "./app.js";
import { config } from "./config.js";
import { registerRealtime } from "./realtime.js";

const app = buildApp({ logger: true });
registerRealtime(app.server);

try {
	await app.listen({ host: config.HOST, port: config.PORT });
} catch (error) {
	app.log.error(error);
	process.exit(1);
}
