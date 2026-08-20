import type { PostgresDb } from "@fastify/postgres";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type {
	DocumentSensitivityChangeRecord,
	DocumentSensitivityChangeRepositoryPort,
} from "../../application/ports/repos/DocumentSensitivityChangeRepository.port.js";

class DocumentSensitivityChangeRepositoryAdapter implements DocumentSensitivityChangeRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async create(record: DocumentSensitivityChangeRecord, tx?: TransactionContext) {
		const executor = tx?.client ?? this.dbPool;
		const result = await executor.query(
			`INSERT INTO policy.document_sensitivity_change_requests (
				id, document_id, from_sensitivity, to_sensitivity,
				requested_by, reason, status, requested_at
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *;`,
			[
				record.id, record.documentId, record.fromSensitivity,
				record.toSensitivity, record.requestedBy, record.reason,
				record.status, record.requestedAt,
			],
		);
		return this.map(result.rows[0]);
	}

	async findById(id: string) {
		const result = await this.dbPool.query(
			"SELECT * FROM policy.document_sensitivity_change_requests WHERE id = $1 LIMIT 1;",
			[id],
		);
		return result.rows[0] ? this.map(result.rows[0]) : null;
	}

	async markApplied(id: string, reviewedBy: string, reviewReason: string, tx?: TransactionContext) {
		const executor = tx?.client ?? this.dbPool;
		const result = await executor.query(
			`UPDATE policy.document_sensitivity_change_requests
			 SET status = 'applied', reviewed_by = $2, review_reason = $3,
				reviewed_at = NOW(), applied_at = NOW()
			 WHERE id = $1 AND status = 'pending';`,
			[id, reviewedBy, reviewReason],
		);
		return (result.rowCount ?? 0) === 1;
	}

	async markRejected(id: string, reviewedBy: string, reviewReason: string, tx?: TransactionContext) {
		const executor = tx?.client ?? this.dbPool;
		const result = await executor.query(
			`UPDATE policy.document_sensitivity_change_requests
			 SET status = 'rejected', reviewed_by = $2, review_reason = $3,
				reviewed_at = NOW()
			 WHERE id = $1 AND status = 'pending';`,
			[id, reviewedBy, reviewReason],
		);
		return (result.rowCount ?? 0) === 1;
	}

	private map(row: any): DocumentSensitivityChangeRecord {
		return {
			id: row.id,
			documentId: row.document_id,
			fromSensitivity: row.from_sensitivity,
			toSensitivity: row.to_sensitivity,
			requestedBy: row.requested_by,
			reason: row.reason,
			status: row.status,
			requestedAt: row.requested_at,
		};
	}
}

export default DocumentSensitivityChangeRepositoryAdapter;
