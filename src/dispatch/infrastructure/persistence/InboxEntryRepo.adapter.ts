import type { PostgresDb } from "@fastify/postgres";
import {
    Category
} from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type {
    InboxEntryRepositoryPort,
} from "../../application/port/repos/InboxEntryRepository.port.js";
import type InboxEntry from "../../domain/entities/InboxEntry.js";
import type { InboxEntryPayload } from "../../domain/entities/InboxEntry.js";
import InboxEntryEntity from "../../domain/entities/InboxEntry.js";
import { InboxEntryStatus } from "../../domain/enum/inboxEntryStatus.enum.js";

class InboxEntryRepoAdapter implements InboxEntryRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private toDomain(row: any): InboxEntry {
		return new InboxEntryEntity({
			id: row.id,
			dispatchId: row.dispatch_id,
			documentId: row.document_id,
			staffId: row.staff_id,
			designationId: row.designation_id,
			unitId: row.unit_id,
			status: row.status as InboxEntryStatus,
			receivedAt: row.received_at,
			readAt: row.read_at,
			acknowledgedAt: row.acknowledged_at,
		});
	}

	async save(
		payload: InboxEntryPayload,
		tx?: TransactionContext,
	): Promise<InboxEntry> {
		try {
			const query = `
				INSERT INTO dispatch.inbox_entries (
					id,
					dispatch_id,
					document_id,
					staff_id,
					designation_id,
					unit_id,
					status,
					received_at,
					read_at,
					acknowledged_at
				)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
				ON CONFLICT (id)
				DO UPDATE SET
					dispatch_id = EXCLUDED.dispatch_id,
					document_id = EXCLUDED.document_id,
					staff_id = EXCLUDED.staff_id,
					designation_id = EXCLUDED.designation_id,
					unit_id = EXCLUDED.unit_id,
					status = EXCLUDED.status,
					received_at = EXCLUDED.received_at,
					read_at = EXCLUDED.read_at,
					acknowledged_at = EXCLUDED.acknowledged_at
				RETURNING *;
			`;

			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, [
				payload.id,
				payload.dispatchId,
				payload.documentId,
				payload.staffId,
				payload.designationId ?? null,
				payload.unitId ?? null,
				typeof payload.status === "string"
					? (payload.status.toLowerCase() as InboxEntryStatus)
					: payload.status ?? InboxEntryStatus.UNREAD,
				payload.receivedAt ?? new Date(),
				payload.readAt ?? null,
				payload.acknowledgedAt ?? null,
			]);

			return this.toDomain(result.rows[0]);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
				table: postgresError.details?.table,
				column: postgresError.details?.column,
			});
		}
	}

	async saveMany(
		payload: InboxEntryPayload[],
		tx?: TransactionContext,
	): Promise<InboxEntry[]> {
		const saved: InboxEntry[] = [];

		for (const entry of payload) {
			saved.push(await this.save(entry, tx));
		}

		return saved;
	}

	async fetchAll(): Promise<InboxEntry[]> {
		try {
			const query = `
				SELECT *
				FROM dispatch.inbox_entries
				ORDER BY received_at DESC, id DESC;
			`;

			const result = await this.dbPool.query(query);

			if (!result.rows || result.rows.length === 0) return [];

			return result.rows.map((row) => this.toDomain(row));
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
				table: postgresError.details?.table,
				column: postgresError.details?.column,
			});
		}
	}
}

export default InboxEntryRepoAdapter;
