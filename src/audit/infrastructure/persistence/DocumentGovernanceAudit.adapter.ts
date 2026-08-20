import type { PostgresDb } from "@fastify/postgres";
import { createHmac, randomUUID } from "node:crypto";
import type {
	DocumentGovernanceAuditEvent,
	DocumentGovernanceAuditPort,
} from "../../../shared/application/port/intersubsystem/DocumentGovernanceAudit.port.js";

class DocumentGovernanceAuditAdapter implements DocumentGovernanceAuditPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async record(event: DocumentGovernanceAuditEvent): Promise<void> {
		const key = process.env.AUDIT_HMAC_KEY ??
			(process.env.NODE_ENV === "production"
				? null
				: "nexusfons-development-audit-key-change-before-production");
		if (!key || key.length < 32) {
			throw new Error("AUDIT_HMAC_KEY must contain at least 32 characters");
		}

		const client = await this.dbPool.connect();
		try {
			await client.query("BEGIN");
			await client.query(
				"SELECT pg_advisory_xact_lock(hashtext($1));",
				[`document:${event.documentId}`],
			);
			const previous = await client.query<{ event_hash: string | null }>(
				`SELECT event_hash FROM audit.events
				 WHERE aggregate_type = 'document' AND aggregate_id = $1
					AND event_hash IS NOT NULL
				 ORDER BY occurred_at DESC, id DESC LIMIT 1;`,
				[event.documentId],
			);
			const previousHash = previous.rows[0]?.event_hash ?? null;
			const occurredAt = new Date();
			const id = `AUDIT-${randomUUID()}`;
			const metadata = {
				policyId: event.policyId,
				policyVersion: event.policyVersion,
				obligations: event.obligations ?? [],
				ipAddress: event.ipAddress ?? null,
				deviceFingerprint: event.deviceFingerprint ?? null,
				...(event.metadata ?? {}),
			};
			const canonical = JSON.stringify({
				id,
				actorStaffId: event.actorStaffId,
				documentId: event.documentId,
				action: event.action,
				outcome: event.outcome,
				reasonCode: event.reasonCode,
				metadata,
				occurredAt: occurredAt.toISOString(),
				previousHash,
			});
			const eventHash = createHmac("sha256", key).update(canonical).digest("hex");

			await client.query(
				`INSERT INTO audit.events (
					id, actor_id, actor_type, action, event_type,
					aggregate_type, aggregate_id, outcome, reason,
					request_id, metadata, occurred_at,
					previous_hash, event_hash, hash_algorithm
				) VALUES (
					$1, $2, 'staff', $3, 'document_governance',
					'document', $4, $5, $6, $7, $8, $9, $10, $11, 'hmac-sha256'
				);`,
				[
					id,
					event.actorStaffId,
					event.action,
					event.documentId,
					event.outcome,
					event.reasonCode,
					event.requestId ?? null,
					metadata,
					occurredAt,
					previousHash,
					eventHash,
				],
			);
			await client.query("COMMIT");
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		} finally {
			client.release();
		}
	}
}

export default DocumentGovernanceAuditAdapter;
