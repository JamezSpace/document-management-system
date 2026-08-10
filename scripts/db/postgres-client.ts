import { Client } from "pg";

function createDatabaseClient(): Client {
	const port = process.env.DB_PORT
		? Number.parseInt(process.env.DB_PORT, 10)
		: undefined;

	if (port !== undefined && Number.isNaN(port)) {
		throw new Error("DB_PORT must be an integer");
	}

	return new Client({
		host: process.env.DB_HOST,
		...(port !== undefined ? { port } : {}),
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
	});
}

export { createDatabaseClient };
