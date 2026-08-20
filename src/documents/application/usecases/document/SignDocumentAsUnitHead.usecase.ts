import type { DocumentGovernanceContextPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernanceContext.port.js";
import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type { DocumentSignatureRepositoryPort } from "../../ports/repos/DocumentSignatureRepository.port.js";
import type { DocumentGovernanceAuditPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernanceAudit.port.js";

class SignDocumentAsUnitHeadUseCase {
	constructor(
		private readonly ids: IdGeneratorPort,
		private readonly documents: DocumentRepositoryPort,
		private readonly signatures: DocumentSignatureRepositoryPort,
		private readonly contexts: DocumentGovernanceContextPort,
		private readonly transactionManager: TransactionManager,
		private readonly audit: DocumentGovernanceAuditPort,
	) {}

	async execute(documentId: string, actorStaffId: string) {
		const document = await this.documents.findDocumentById(documentId);
		if (!document) {
			throw new ApplicationError(ApplicationErrorEnum.DOCUMENT_NOT_FOUND, {
				message: `Document with id ${documentId} doesn't exist.`,
			});
		}
		const context = await this.contexts.resolve(documentId, actorStaffId);
		if (
			!context.relationships.includes("unit_head") &&
			!context.relationships.includes("delegated_unit_head")
		) {
			await this.audit.record({
				actorStaffId, documentId, action: "unit_head_signature", outcome: "denied",
				reasonCode: "effective_unit_head_required",
				policyId: document.classification.governancePolicyKey!,
				policyVersion: document.classification.governancePolicyVersion!,
				obligations: ["audit_security_event"],
			});
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Only the effective Unit Head may sign this document",
				details: { documentId },
			});
		}

		const signedAt = new Date();
		await this.transactionManager.execute((tx) =>
			this.signatures.recordUnitHeadSignature(
				{
					id: `DOC-SIGN-${this.ids.generate()}`,
					documentId,
					signedBy: actorStaffId,
					signedAt,
				},
				tx,
			),
		);
		await this.audit.record({
			actorStaffId, documentId, action: "unit_head_signature", outcome: "success",
			reasonCode: "effective_unit_head_signed",
			policyId: document.classification.governancePolicyKey!,
			policyVersion: document.classification.governancePolicyVersion!,
			obligations: ["audit_security_event"],
		});
		return { documentId, signedBy: actorStaffId, signedAt };
	}
}

export default SignDocumentAsUnitHeadUseCase;
