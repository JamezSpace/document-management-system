import type { DocumentGovernanceAuditPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernanceAudit.port.js";
import type { DocumentGovernanceContextPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernanceContext.port.js";
import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import type {
	DocumentGovernanceGrantRepositoryPort,
	DocumentGovernanceGrantType,
} from "../../ports/repos/DocumentGovernanceGrantRepository.port.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type Document from "../../../domain/entities/document/Document.js";

class ManageDocumentGovernanceGrantUseCase {
	constructor(
		private readonly ids: IdGeneratorPort,
		private readonly documents: DocumentRepositoryPort,
		private readonly grants: DocumentGovernanceGrantRepositoryPort,
		private readonly contexts: DocumentGovernanceContextPort,
		private readonly audit: DocumentGovernanceAuditPort,
		private readonly transactionManager: TransactionManager,
	) {}

	async grant(payload: {
		documentId: string;
		granteeStaffId: string;
		grantType: DocumentGovernanceGrantType;
		reason: string;
		validTo?: Date | null;
		remainingUses?: number | null;
		actorStaffId: string;
	}) {
		const document = await this.requireDocument(payload.documentId);
		if (document.classification.sensitivity !== "confidential") {
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Dynamic governance grants apply only to confidential documents",
			});
		}
		const authority = await this.resolveAuthority(document.id, document.ownerId, payload.actorStaffId);
		const granteeContext = await this.contexts.resolve(document.id, payload.granteeStaffId);
		if (!granteeContext.isAuthenticatedInternalStaff) {
			throw new ApplicationError(ApplicationErrorEnum.STAFF_NOT_FOUND, {
				message: "Governance grants require an active internal staff recipient",
			});
		}
		const reason = this.requireReason(payload.reason);
		if (payload.validTo && payload.validTo <= new Date()) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "Grant expiry must be in the future",
			});
		}
		if (!payload.validTo) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "Governance grants must have a future expiry",
			});
		}
		if (payload.grantType === "export" && payload.remainingUses !== undefined && payload.remainingUses !== null && payload.remainingUses < 1) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "Export grant remaining uses must be at least one",
			});
		}

		const record = await this.transactionManager.execute((tx) =>
			this.grants.create(
				{
					id: `DOC-GRANT-${this.ids.generate()}`,
					documentId: document.id,
					granteeStaffId: payload.granteeStaffId,
					grantType: payload.grantType,
					grantedBy: payload.actorStaffId,
					grantorAuthority: authority,
					reason,
					validFrom: new Date(),
					validTo: payload.validTo ?? null,
					remainingUses: payload.grantType === "export"
						? payload.remainingUses ?? 1
						: null,
				},
				tx,
			),
		);
		await this.auditGovernanceChange(document, payload.actorStaffId, "grant_access", "grant_created", {
			grantId: record.id,
			grantType: record.grantType,
			granteeStaffId: record.granteeStaffId,
			reason,
		});
		return record;
	}

	async revoke(documentId: string, grantId: string, actorStaffId: string, reasonText: string) {
		const grant = await this.grants.findById(grantId);
		if (!grant) {
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Governance grant was not found",
			});
		}
		if (grant.documentId !== documentId) {
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Governance grant does not belong to this document",
			});
		}
		const document = await this.requireDocument(grant.documentId);
		await this.resolveAuthority(document.id, document.ownerId, actorStaffId);
		const reason = this.requireReason(reasonText);
		const revoked = await this.transactionManager.execute((tx) =>
			this.grants.revoke(grantId, actorStaffId, reason, tx),
		);
		if (!revoked) {
			throw new ApplicationError(ApplicationErrorEnum.CONFLICT, {
				message: "Governance grant has already been revoked",
			});
		}
		await this.auditGovernanceChange(document, actorStaffId, "revoke_access", "grant_revoked", {
			grantId,
			granteeStaffId: grant.granteeStaffId,
			reason,
		});
		return { grantId, revoked };
	}

	private async resolveAuthority(documentId: string, ownerId: string, actorStaffId: string) {
		if (ownerId === actorStaffId) return "originator" as const;
		const context = await this.contexts.resolve(documentId, actorStaffId);
		if (context.relationships.includes("unit_head") || context.relationships.includes("delegated_unit_head")) {
			return "unit_head" as const;
		}
		throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
			message: "Only the originator or effective Unit Head may manage governance grants",
		});
	}

	private requireReason(value: string) {
		const reason = value.trim();
		if (!reason) throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, { message: "A recorded reason is required" });
		return reason;
	}

	private async requireDocument(documentId: string) {
		const document = await this.documents.findDocumentById(documentId);
		if (!document) throw new ApplicationError(ApplicationErrorEnum.DOCUMENT_NOT_FOUND, { message: `Document with id ${documentId} doesn't exist.` });
		return document;
	}

	private auditGovernanceChange(document: Document, actorStaffId: string, action: string, reasonCode: string, metadata: Record<string, unknown>) {
		const policyId = document.classification.governancePolicyKey;
		const policyVersion = document.classification.governancePolicyVersion;
		if (!policyId || !policyVersion) throw new ApplicationError(ApplicationErrorEnum.POLICY_NOT_FOUND, { message: "Document has no governance-policy binding" });
		return this.audit.record({
			actorStaffId,
			documentId: document.id,
			action,
			outcome: "success",
			reasonCode,
			policyId,
			policyVersion,
			obligations: ["audit_security_event", "audit_justification"],
			metadata,
		});
	}
}

export default ManageDocumentGovernanceGrantUseCase;
