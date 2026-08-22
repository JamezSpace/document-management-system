import type { PostgresDb } from "@fastify/postgres";
import type { DocumentExtractionRepositoryPort, DocumentExtractionRecord } from "../../application/ports/repos/DocumentExtractionRepository.port.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";

class DocumentExtractionRepositoryAdapter implements DocumentExtractionRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async record(value: DocumentExtractionRecord, tx: TransactionContext) {
		await tx.client.query(
			`INSERT INTO policy.document_extractions (
				id, document_id, document_revision, actor_staff_id, extraction_action,
				grant_id, policy_key, policy_version, obligations, watermark_text, artifact_sha256
			 ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11);`,
			[
				value.id, value.documentId, value.documentRevision, value.actorStaffId,
				value.action, value.grantId, value.policyId, value.policyVersion,
				value.obligations, value.watermarkText, value.artifactSha256,
			],
		);
	}
}

export default DocumentExtractionRepositoryAdapter;
