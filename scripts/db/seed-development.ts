import { readFile } from "node:fs/promises";
import { developmentSeedPath } from "./migration-files.js";
import { createDatabaseClient } from "./postgres-client.js";

if (process.env.NODE_ENV === "production") {
	throw new Error("The development seed cannot run with NODE_ENV=production");
}

const client = createDatabaseClient();
const lockName = "nexus_fons_development_seed";

try {
	await client.connect();
	await client.query("SELECT pg_advisory_lock(hashtext($1));", [lockName]);
	const sql = await readFile(developmentSeedPath, "utf8");

	await client.query("BEGIN");
	try {
		await client.query(sql);
		await client.query("COMMIT");
		console.log("Development seed applied.");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	}
} finally {
	if ((client as unknown as { _connected?: boolean })._connected) {
		await client
			.query("SELECT pg_advisory_unlock(hashtext($1));", [lockName])
			.catch(() => undefined);
	}
	await client.end().catch(() => undefined);
}
