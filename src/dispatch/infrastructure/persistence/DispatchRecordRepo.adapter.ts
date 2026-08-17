import type { PostgresDb } from "@fastify/postgres";
import {
    Category
} from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type { DispatchRecordRepositoryPort } from "../../application/port/repos/DispatchRecordRepository.port.js";
import type DispatchRecord from "../../domain/entities/DispatchRecord.js";
import DispatchRecordEntity from "../../domain/entities/DispatchRecord.js";

class DispatchRecordRepoAdapter
	implements DispatchRecordRepositoryPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	private toDomain(row: any): DispatchRecord {
		return new DispatchRecordEntity({
			id: row.id,
			documentId: row.document_id,
			senderStaffId: row.sender_staff_id,
			senderDesignationId: row.sender_designation_id,
			senderUnitId: row.sender_unit_id,
			recipientDesignationId: row.recipient_designation_id,
			recipientUnitId: row.recipient_unit_id,
			dispatchType: row.dispatch_type,
			status: row.status,
			dispatchedAt: row.dispatched_at,
			parentDispatchId: row.parent_dispatch_id,
		});
	}

	async save(
		payload: DispatchRecord,
		tx?: TransactionContext,
	): Promise<DispatchRecord> {
		try {
			const query = `
				INSERT INTO dispatch.dispatch_records (
					id,
					document_id,
					sender_staff_id,
					sender_designation_id,
					sender_unit_id,
					recipient_designation_id,
					recipient_unit_id,
					dispatch_type,
					status,
					dispatched_at,
					parent_dispatch_id
				)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
				ON CONFLICT (id)
				DO UPDATE SET
					document_id = EXCLUDED.document_id,
					sender_staff_id = EXCLUDED.sender_staff_id,
					sender_designation_id = EXCLUDED.sender_designation_id,
					sender_unit_id = EXCLUDED.sender_unit_id,
					recipient_designation_id = EXCLUDED.recipient_designation_id,
					recipient_unit_id = EXCLUDED.recipient_unit_id,
					dispatch_type = EXCLUDED.dispatch_type,
					status = EXCLUDED.status,
					dispatched_at = EXCLUDED.dispatched_at,
					parent_dispatch_id = EXCLUDED.parent_dispatch_id
				RETURNING *;
			`;

			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, [
				payload.id,
				payload.documentId,
				payload.senderStaffId,
				payload.senderDesignationId ?? null,
				payload.senderUnitId,
				payload.recipientDesignationId ?? null,
				payload.recipientUnitId,
				payload.dispatchType,
				payload.status,
				payload.dispatchedAt,
				payload.parentDispatchId ?? null,
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
		payload: DispatchRecord[],
		tx?: TransactionContext,
	): Promise<DispatchRecord[]> {
		const saved: DispatchRecord[] = [];

		for (const record of payload) {
			saved.push(await this.save(record, tx));
		}

		return saved;
	}

	async fetchAll(): Promise<DispatchRecord[]> {
		try {
			const query = `
				SELECT *
				FROM dispatch.dispatch_records
				ORDER BY dispatched_at DESC, id DESC;
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

export default DispatchRecordRepoAdapter;
