import { loadMigrationFiles } from "./migration-files.js";

const migrations = await loadMigrationFiles();

for (const migration of migrations) {
	console.log(
		`${String(migration.version).padStart(4, "0")} ${migration.checksum} ${migration.name}`,
	);
}

console.log(`Validated ${migrations.length} ordered migration files.`);
