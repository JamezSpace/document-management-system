import type { PostgresDb } from "@fastify/postgres";
import { Category, GlobalInfrastructureErrors } from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type { MinuteRepositoryPort } from "../../application/ports/repos/MinuteRepository.port.js";
import Minute from "../../domain/entities/minute/Minute.js";
import { MinuteAction } from "../../domain/enum/MinuteAction.enum.js";

class MinuteRepositoryAdapter implements MinuteRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private toDomain(row: any): Minute {
		return new Minute({
			id: row.id,
			documentId: row.document_id,
			authorStaffId: row.author_staff_id,
			action: row.action as MinuteAction,
			content: row.content,
			inboxEntryId: row.inbox_entry_id,
			parentMinuteId: row.parent_minute_id,
			createdAt: row.created_at,
		});
	}

	async save(minute: Minute, tx?: TransactionContext): Promise<Minute> {
		try {
			const query = `
				INSERT INTO document.minutes (
					id, document_id, inbox_entry_id, author_staff_id, parent_minute_id, action, content, created_at
				)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
				RETURNING *;
			`;

			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, [
				minute.id,
				minute.documentId,
				minute.inboxEntryId,
				minute.authorStaffId,
				minute.parentMinuteId,
				minute.action,
				minute.content,
				minute.createdAt,
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

	async findById(minuteId: string, tx?: TransactionContext): Promise<Minute | null> {
		try {
			const query = "SELECT * FROM document.minutes WHERE id = $1 LIMIT 1;";
			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, [minuteId]);

			if (!result.rows || result.rows.length === 0) return null;

			return this.toDomain(result.rows[0]);
		} catch (error: any) {
			throw new InfrastructureError(
				GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
				{
					category: Category.PERSISTENCE,
					message: error.message,
				},
			);
		}
	}

	async findByDocumentId(documentId: string, tx?: TransactionContext): Promise<Minute[]> {
		try {
			const query = `
				SELECT *
				FROM document.minutes
				WHERE document_id = $1
				ORDER BY created_at ASC;
			`;
			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, [documentId]);

			if (!result.rows || result.rows.length === 0) return [];

			return result.rows.map((row) => this.toDomain(row));
		} catch (error: any) {
			throw new InfrastructureError(
				GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
				{
					category: Category.PERSISTENCE,
					message: error.message,
				},
			);
		}
	}
}

export default MinuteRepositoryAdapter;
