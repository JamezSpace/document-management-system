import type { PostgresDb } from "@fastify/postgres";
import type { DocumentSignatureRepositoryPort } from "../../application/ports/repos/DocumentSignatureRepository.port.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";

class DocumentSignatureRepositoryAdapter implements DocumentSignatureRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async recordUnitHeadSignature(
		payload: { id: string; documentId: string; signedBy: string; signedAt: Date },
		tx?: TransactionContext,
	): Promise<void> {
		const executor = tx?.client ?? this.dbPool;
		await executor.query(
			`INSERT INTO document.document_unit_head_signatures
				(id, document_id, signed_by, signed_at)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT (document_id) WHERE revoked_at IS NULL DO NOTHING;`,
			[payload.id, payload.documentId, payload.signedBy, payload.signedAt],
		);
	}
}

export default DocumentSignatureRepositoryAdapter;
