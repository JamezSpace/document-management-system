import type { DocumentGovernanceAuditPort } from "../../../shared/application/port/intersubsystem/DocumentGovernanceAudit.port.js";
import type { TransactionManager } from "../../../shared/application/port/TransactionManager.port.js";
import type { TransferredCustodyRepositoryPort } from "../port/repos/TransferredCustodyRepository.port.js";

class HandoverTransferredStaffCustodyUseCase {
	constructor(
		private readonly custody: TransferredCustodyRepositoryPort,
		private readonly transactions: TransactionManager,
		private readonly audit: DocumentGovernanceAuditPort,
	) {}

	async execute(staffId: string) {
		const records = await this.transactions.execute((tx) => this.custody.handover(staffId, tx));
		for (const record of records) {
			await this.audit.record({
				actorStaffId: staffId,
				documentId: record.documentId,
				action: "transfer_custody_handover",
				outcome: "success",
				reasonCode: record.state,
				policyId: record.policyId,
				policyVersion: record.policyVersion,
				obligations: ["audit_security_event"],
				metadata: { ...record },
			});
		}
		return records;
	}

	async claimForIncomingStaff(staffId: string) {
		const records = await this.transactions.execute((tx) =>
			this.custody.claimForIncomingStaff(staffId, tx),
		);
		for (const record of records) {
			await this.audit.record({
				actorStaffId: staffId,
				documentId: record.documentId,
				action: "incoming_desk_custody_claim",
				outcome: "success",
				reasonCode: "handover_reassigned",
				policyId: record.policyId,
				policyVersion: record.policyVersion,
				obligations: ["audit_security_event"],
				metadata: { ...record },
			});
		}
		return records;
	}
}

export default HandoverTransferredStaffCustodyUseCase;
