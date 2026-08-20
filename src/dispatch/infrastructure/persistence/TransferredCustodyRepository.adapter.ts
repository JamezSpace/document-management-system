import type { PostgresDb } from "@fastify/postgres";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type {
	CustodyHandoverRecord,
	TransferredCustodyRepositoryPort,
} from "../../application/port/repos/TransferredCustodyRepository.port.js";

class TransferredCustodyRepositoryAdapter implements TransferredCustodyRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async handover(staffId: string, tx: TransactionContext): Promise<CustodyHandoverRecord[]> {
		const stale = await tx.client.query<{
			id: string;
			document_id: string;
			dispatch_id: string;
			replacement_ids: string[] | null;
			governance_policy_key: string;
			governance_policy_version: number;
		}>(
			`SELECT ie.id, ie.document_id, ie.dispatch_id, replacements.ids AS replacement_ids,
				document_record.governance_policy_key, document_record.governance_policy_version
			 FROM dispatch.inbox_entries ie
			 JOIN identity.staff transferred ON transferred.id = ie.staff_id
			 JOIN document.documents document_record ON document_record.id = ie.document_id
			 LEFT JOIN LATERAL (
				SELECT array_agg(candidate.id ORDER BY candidate.id) AS ids
				FROM identity.staff candidate
				WHERE candidate.id <> transferred.id
					AND candidate.status = 'active'
					AND candidate.unit_id = ie.unit_id
					AND candidate.designation_id = ie.designation_id
			 ) replacements ON TRUE
			 WHERE ie.staff_id = $1
				AND (transferred.status <> 'active'
					OR transferred.unit_id <> ie.unit_id
					OR transferred.designation_id <> ie.designation_id)
			 FOR UPDATE OF ie;`,
			[staffId],
		);

		const records: CustodyHandoverRecord[] = [];
		for (const entry of stale.rows) {
			const replacementId = entry.replacement_ids?.length === 1
				? entry.replacement_ids[0]!
				: null;
			let reassigned = false;
			if (replacementId) {
				const result = await tx.client.query(
					`UPDATE dispatch.inbox_entries
					 SET previous_staff_id = staff_id, staff_id = $2,
						status = 'unread', handed_over_at = NOW()
					 WHERE id = $1
						AND NOT EXISTS (
							SELECT 1 FROM dispatch.inbox_entries conflict
							WHERE conflict.dispatch_id = $3 AND conflict.staff_id = $2
						);`,
					[entry.id, replacementId, entry.dispatch_id],
				);
				reassigned = (result.rowCount ?? 0) === 1;
			}
			if (!reassigned) {
				await tx.client.query(
					`UPDATE dispatch.inbox_entries
					 SET previous_staff_id = staff_id, status = 'in_handover', handed_over_at = NOW()
					 WHERE id = $1;`,
					[entry.id],
				);
			}
			records.push({
				documentId: entry.document_id,
				previousStaffId: staffId,
				replacementStaffId: reassigned ? replacementId : null,
				state: reassigned ? "reassigned" : "in_handover",
				policyId: entry.governance_policy_key,
				policyVersion: entry.governance_policy_version,
			});
		}
		return records;
	}

	async claimForIncomingStaff(staffId: string, tx: TransactionContext): Promise<CustodyHandoverRecord[]> {
		const result = await tx.client.query<{
			document_id: string;
			previous_staff_id: string;
			governance_policy_key: string;
			governance_policy_version: number;
		}>(
			`UPDATE dispatch.inbox_entries ie
			 SET staff_id = incoming.id, status = 'unread', handed_over_at = NOW()
			 FROM identity.staff incoming, document.documents document_record
			 WHERE incoming.id = $1
				AND incoming.status = 'active'
				AND ie.status = 'in_handover'
				AND ie.unit_id = incoming.unit_id
				AND ie.designation_id = incoming.designation_id
				AND document_record.id = ie.document_id
				AND NOT EXISTS (
					SELECT 1 FROM dispatch.inbox_entries conflict
					WHERE conflict.dispatch_id = ie.dispatch_id AND conflict.staff_id = incoming.id
				)
			 RETURNING ie.document_id, ie.previous_staff_id,
				document_record.governance_policy_key, document_record.governance_policy_version;`,
			[staffId],
		);
		return result.rows.map((row) => ({
			documentId: row.document_id,
			previousStaffId: row.previous_staff_id,
			replacementStaffId: staffId,
			state: "reassigned",
			policyId: row.governance_policy_key,
			policyVersion: row.governance_policy_version,
		}));
	}
}

export default TransferredCustodyRepositoryAdapter;
