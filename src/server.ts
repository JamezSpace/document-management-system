import { buildApp } from "./app.js";

const server = buildApp();

try {
	const address = await server.listen({
		port: Number(process.env.PORT) || 4200,
		host: "0.0.0.0",
	});
	server.log.info(`Server running on ${address}`);
} catch (error) {
	server.log.error(error);
	process.exitCode = 1;
}
