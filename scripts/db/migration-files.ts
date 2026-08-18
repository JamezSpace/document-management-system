import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface MigrationFile {
	version: number;
	name: string;
	fileName: string;
	path: string;
	checksum: string;
	compatibleChecksums: readonly string[];
	sql: string;
}

const repositoryRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../..",
);
const migrationsDirectory = path.join(repositoryRoot, "db", "migrations");
const developmentSeedPath = path.join(
	repositoryRoot,
	"db",
	"seeds",
	"development.sql",
);

async function loadMigrationFiles(): Promise<MigrationFile[]> {
	const entries = await readdir(migrationsDirectory, { withFileTypes: true });
	const candidates = entries
		.filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
		.map((entry) => entry.name)
		.sort();

	const migrations: MigrationFile[] = [];
	const seenVersions = new Set<number>();

	for (const fileName of candidates) {
		const match = /^(\d{4})_([a-z0-9_]+)\.sql$/.exec(fileName);
		if (!match) {
			throw new Error(
				`Invalid migration filename ${fileName}; expected NNNN_lower_snake_case.sql`,
			);
		}

		const version = Number(match[1]);
		if (seenVersions.has(version)) {
			throw new Error(`Duplicate migration version ${match[1]}`);
		}
		seenVersions.add(version);

		const migrationPath = path.join(migrationsDirectory, fileName);
		const sql = await readFile(migrationPath, "utf8");
		const canonicalSql = sql.replace(/\r\n/g, "\n");
		if (sql.trim().length === 0) {
			throw new Error(`Migration ${fileName} is empty`);
		}
		if (/\b(?:BEGIN|COMMIT|ROLLBACK)\s*;/i.test(sql)) {
			throw new Error(
				`Migration ${fileName} controls its own transaction; the runner owns transactions`,
			);
		}

		const checksum = createHash("sha256")
			.update(canonicalSql)
			.digest("hex");
		const crlfChecksum = createHash("sha256")
			.update(canonicalSql.replace(/\n/g, "\r\n"))
			.digest("hex");

		migrations.push({
			version,
			name: match[2]!,
			fileName,
			path: migrationPath,
			checksum,
			compatibleChecksums: [...new Set([checksum, crlfChecksum])],
			sql,
		});
	}

	for (let index = 1; index < migrations.length; index++) {
		if (migrations[index]!.version <= migrations[index - 1]!.version) {
			throw new Error("Migrations are not strictly ordered");
		}
	}

	return migrations;
}

export {
	developmentSeedPath,
	loadMigrationFiles,
	migrationsDirectory,
	repositoryRoot,
	type MigrationFile,
};
