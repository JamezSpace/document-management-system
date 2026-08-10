import { createDatabaseClient } from "./postgres-client.js";
import { loadMigrationFiles } from "./migration-files.js";

interface AppliedMigrationRow {
	version: number;
	name: string;
	checksum: string;
}

const lockName = "nexus_fons_schema_migrations";
const client = createDatabaseClient();

try {
	await client.connect();
	await client.query("SELECT pg_advisory_lock(hashtext($1));", [lockName]);
	await client.query(`
		CREATE TABLE IF NOT EXISTS public.schema_migrations (
			version INTEGER PRIMARY KEY,
			name TEXT NOT NULL,
			checksum CHAR(64) NOT NULL,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`);

	const migrationFiles = await loadMigrationFiles();
	const appliedResult = await client.query<AppliedMigrationRow>(
		"SELECT version, name, checksum FROM public.schema_migrations ORDER BY version;",
	);
	const applied = new Map(
		appliedResult.rows.map((row) => [row.version, row] as const),
	);

	for (const migration of migrationFiles) {
		const existing = applied.get(migration.version);
		if (existing) {
			if (
				existing.name !== migration.name ||
				existing.checksum.trim() !== migration.checksum
			) {
				throw new Error(
					`Applied migration ${migration.version} differs from ${migration.fileName}`,
				);
			}
			continue;
		}

		await client.query("BEGIN");
		try {
			await client.query(migration.sql);
			await client.query(
				`INSERT INTO public.schema_migrations (version, name, checksum)
				 VALUES ($1, $2, $3);`,
				[migration.version, migration.name, migration.checksum],
			);
			await client.query("COMMIT");
			console.log(`Applied ${migration.fileName}`);
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		}
	}

	console.log(`Database is current (${migrationFiles.length} migrations).`);
} finally {
	if ((client as unknown as { _connected?: boolean })._connected) {
		await client
			.query("SELECT pg_advisory_unlock(hashtext($1));", [lockName])
			.catch(() => undefined);
	}
	await client.end().catch(() => undefined);
}
