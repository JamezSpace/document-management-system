import type { PostgresDb } from "@fastify/postgres";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type {
	DocumentGovernanceGrantRecord,
	DocumentGovernanceGrantRepositoryPort,
} from "../../application/ports/repos/DocumentGovernanceGrantRepository.port.js";

class DocumentGovernanceGrantRepositoryAdapter implements DocumentGovernanceGrantRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async create(record: DocumentGovernanceGrantRecord, tx?: TransactionContext) {
		const executor = tx?.client ?? this.dbPool;
		const result = await executor.query(
			`INSERT INTO policy.document_governance_grants (
				id, document_id, grantee_staff_id, grant_type, granted_by,
				grantor_authority, reason, valid_from, valid_to, remaining_uses
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
			RETURNING *;`,
			[
				record.id, record.documentId, record.granteeStaffId, record.grantType,
				record.grantedBy, record.grantorAuthority, record.reason,
				record.validFrom, record.validTo, record.remainingUses,
			],
		);
		return this.map(result.rows[0]);
	}

	async findById(id: string) {
		const result = await this.dbPool.query(
			"SELECT * FROM policy.document_governance_grants WHERE id = $1 LIMIT 1;",
			[id],
		);
		return result.rows[0] ? this.map(result.rows[0]) : null;
	}

	async revoke(id: string, actorStaffId: string, reason: string, tx?: TransactionContext) {
		const executor = tx?.client ?? this.dbPool;
		const result = await executor.query(
			`UPDATE policy.document_governance_grants
			 SET revoked_by = $2, revoked_at = NOW(), revocation_reason = $3
			 WHERE id = $1 AND revoked_at IS NULL;`,
			[id, actorStaffId, reason],
		);
		return (result.rowCount ?? 0) > 0;
	}

	private map(row: any): DocumentGovernanceGrantRecord {
		return {
			id: row.id,
			documentId: row.document_id,
			granteeStaffId: row.grantee_staff_id,
			grantType: row.grant_type,
			grantedBy: row.granted_by,
			grantorAuthority: row.grantor_authority,
			reason: row.reason,
			validFrom: row.valid_from,
			validTo: row.valid_to,
			remainingUses: row.remaining_uses,
		};
	}
}

export default DocumentGovernanceGrantRepositoryAdapter;
