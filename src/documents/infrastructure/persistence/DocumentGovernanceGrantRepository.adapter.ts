import type { PostgresDb } from "@fastify/postgres";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type {
	DocumentGovernanceGrantRecord,
	DocumentGovernanceGrantRepositoryPort,
} from "../../application/ports/repos/DocumentGovernanceGrantRepository.port.js";

class DocumentGovernanceGrantRepositoryAdapter implements DocumentGovernanceGrantRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async create(record: Omit<DocumentGovernanceGrantRecord, "status" | "revokedBy" | "revokedAt" | "revocationReason" | "createdAt">, tx?: TransactionContext) {
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

	async listByDocument(documentId: string) {
		const result = await this.dbPool.query(
			`SELECT * FROM policy.document_governance_grants
			 WHERE document_id = $1 ORDER BY created_at DESC, id DESC;`,
			[documentId],
		);
		return result.rows.map((row) => this.map(row));
	}

	async consumeActiveExport(documentId: string, staffId: string, tx: TransactionContext) {
		const result = await tx.client.query(
			`WITH selected AS (
				SELECT id FROM policy.document_governance_grants
				WHERE document_id = $1 AND grantee_staff_id = $2
					AND grant_type = 'export' AND revoked_at IS NULL
					AND valid_from <= NOW() AND valid_to > NOW()
					AND (remaining_uses IS NULL OR remaining_uses > 0)
				ORDER BY valid_to, created_at, id
				FOR UPDATE SKIP LOCKED LIMIT 1
			 )
			 UPDATE policy.document_governance_grants grant_record
			 SET remaining_uses = CASE
				WHEN grant_record.remaining_uses IS NULL THEN NULL
				ELSE grant_record.remaining_uses - 1
			 END
			 FROM selected WHERE grant_record.id = selected.id
			 RETURNING grant_record.*;`,
			[documentId, staffId],
		);
		return result.rows[0] ? this.map(result.rows[0]) : null;
	}

	private map(row: any): DocumentGovernanceGrantRecord {
		const status = row.revoked_at
			? "revoked"
			: row.valid_to && new Date(row.valid_to) <= new Date()
				? "expired"
				: row.grant_type === "export" && row.remaining_uses !== null && row.remaining_uses <= 0
					? "exhausted"
					: "active";
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
			status,
			revokedBy: row.revoked_by ?? null,
			revokedAt: row.revoked_at ?? null,
			revocationReason: row.revocation_reason ?? null,
			createdAt: row.created_at,
		};
	}
}

export default DocumentGovernanceGrantRepositoryAdapter;
