import type { DocumentGovernanceAuditPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernanceAudit.port.js";
import type { DocumentGovernanceContextPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernanceContext.port.js";
import type {
	GovernanceDocumentSensitivity,
	DocumentGovernancePolicyPort,
} from "../../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type { DocumentSensitivityChangeRepositoryPort } from "../../ports/repos/DocumentSensitivityChangeRepository.port.js";
import type Document from "../../../domain/entities/document/Document.js";
import OpaqueCursor from "../../services/OpaqueCursor.service.js";

const sensitivityRank: Record<GovernanceDocumentSensitivity, number> = {
	public: 0,
	internal: 1,
	confidential: 2,
	restricted: 3,
};

class ManageDocumentSensitivityUseCase {
	constructor(
		private readonly ids: IdGeneratorPort,
		private readonly documents: DocumentRepositoryPort,
		private readonly changes: DocumentSensitivityChangeRepositoryPort,
		private readonly policy: DocumentGovernancePolicyPort,
		private readonly contexts: DocumentGovernanceContextPort,
		private readonly audit: DocumentGovernanceAuditPort,
		private readonly transactionManager: TransactionManager,
	) {}

	async requestChange(documentId: string, actorStaffId: string, target: GovernanceDocumentSensitivity, reasonText: string, expectedRevision: number) {
		const document = await this.requireDocument(documentId);
		if (document.ownerId !== actorStaffId) throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, { message: "Only the document author may change sensitivity" });
		const reason = this.requireReason(reasonText);
		const current = document.classification.sensitivity;
		if (current === target) throw new ApplicationError(ApplicationErrorEnum.CONFLICT, { message: "Document already has the requested sensitivity" });
		const isDowngrade = sensitivityRank[target] < sensitivityRank[current];
		if (!isDowngrade) {
			await this.evaluate(document, target, reason, false, false);
			const revision = await this.apply(document, target, actorStaffId, expectedRevision);
			await this.auditChange(document, actorStaffId, current, target, reason, "sensitivity_changed");
			return { status: "applied" as const, documentId, sensitivity: target, documentRevision: revision };
		}

		const result = await this.transactionManager.execute(async (tx) => {
			const request = await this.changes.create({
				id: `DOC-RECLASS-${this.ids.generate()}`,
				documentId,
				fromSensitivity: current,
				toSensitivity: target,
				requestedBy: actorStaffId,
				reason,
				status: "pending",
				requestedAt: new Date(),
			}, tx);
			const revision = await this.documents.incrementRevision(documentId, expectedRevision, tx);
			if (!revision) throw this.stale(documentId, expectedRevision);
			return { request, revision };
		});
		await this.auditChange(document, actorStaffId, current, target, reason, "sensitivity_downgrade_requested");
		return { ...result.request, documentRevision: result.revision };
	}

	async approve(documentId: string, requestId: string, reviewerStaffId: string, reviewReasonText: string, expectedRevision: number) {
		const request = await this.changes.findById(requestId);
		if (!request || request.status !== "pending") throw new ApplicationError(ApplicationErrorEnum.CONFLICT, { message: "Pending sensitivity-change request was not found" });
		const document = await this.requireDocument(request.documentId);
		if (document.id !== documentId) throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, { message: "Sensitivity-change request does not belong to this document" });
		if (document.classification.sensitivity !== request.fromSensitivity) {
			throw new ApplicationError(ApplicationErrorEnum.CONFLICT, { message: "Document sensitivity changed after this request was created" });
		}
		const context = await this.contexts.resolve(document.id, reviewerStaffId);
		if (!context.relationships.includes("unit_head") && !context.relationships.includes("delegated_unit_head")) {
			throw new ApplicationError(ApplicationErrorEnum.INVALID_DELEGATE, { message: "Only the effective Unit Head may approve a sensitivity downgrade" });
		}
		const reviewReason = this.requireReason(reviewReasonText);
		await this.evaluate(document, request.toSensitivity, request.reason, true, true);
		const revision = await this.transactionManager.execute(async (tx) => {
			const claimed = await this.changes.markApplied(request.id, reviewerStaffId, reviewReason, tx);
			if (!claimed) throw new ApplicationError(ApplicationErrorEnum.CONFLICT, { message: "Sensitivity-change request has already been reviewed" });
			document.reclassify({ ...document.classification, sensitivity: request.toSensitivity }, request.requestedBy);
			const edited = await this.documents.editDocument(document, expectedRevision, tx);
			if (!edited) throw this.stale(documentId, expectedRevision);
			return edited.revision;
		});
		await this.auditChange(document, reviewerStaffId, request.fromSensitivity, request.toSensitivity, reviewReason, "sensitivity_downgrade_approved");
		return { requestId, status: "applied" as const, documentId: document.id, sensitivity: request.toSensitivity, documentRevision: revision };
	}

	async reject(documentId: string, requestId: string, reviewerStaffId: string, reviewReasonText: string, expectedRevision: number) {
		const request = await this.changes.findById(requestId);
		if (!request || request.status !== "pending") throw new ApplicationError(ApplicationErrorEnum.CONFLICT, { message: "Pending sensitivity-change request was not found" });
		if (request.documentId !== documentId) throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, { message: "Sensitivity-change request does not belong to this document" });
		const document = await this.requireDocument(documentId);
		const context = await this.contexts.resolve(document.id, reviewerStaffId);
		if (!context.relationships.includes("unit_head") && !context.relationships.includes("delegated_unit_head")) {
			throw new ApplicationError(ApplicationErrorEnum.INVALID_DELEGATE, { message: "Only the effective Unit Head may reject a sensitivity downgrade" });
		}
		const reviewReason = this.requireReason(reviewReasonText);
		const result = await this.transactionManager.execute(async (tx) => {
			const rejected = await this.changes.markRejected(requestId, reviewerStaffId, reviewReason, tx);
			const revision = rejected
				? await this.documents.incrementRevision(documentId, expectedRevision, tx)
				: null;
			if (rejected && !revision) throw this.stale(documentId, expectedRevision);
			return { rejected, revision };
		});
		const { rejected } = result;
		if (!rejected) throw new ApplicationError(ApplicationErrorEnum.CONFLICT, { message: "Sensitivity-change request has already been reviewed" });
		await this.auditChange(document, reviewerStaffId, request.fromSensitivity, request.toSensitivity, reviewReason, "sensitivity_downgrade_rejected");
		return { requestId, status: "rejected" as const, documentId, documentRevision: result.revision };
	}

	async listByDocument(documentId: string, actorStaffId: string) {
		const document = await this.requireDocument(documentId);
		const context = await this.contexts.resolve(documentId, actorStaffId);
		const allowed = document.ownerId === actorStaffId ||
			context.relationships.includes("unit_head") ||
			context.relationships.includes("delegated_unit_head");
		if (!allowed) throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, { message: "Sensitivity-change history is restricted to its author and effective Unit Head" });
		return this.changes.listByDocument(documentId);
	}

	async approvalQueue(actorStaffId: string, limit = 25, cursor?: string) {
		const parsed = OpaqueCursor.decode(cursor, ["requestedAt", "id"]);
		let databaseCursor = parsed
			? { requestedAt: new Date(parsed.requestedAt!), id: parsed.id! }
			: null;
		if (databaseCursor && Number.isNaN(databaseCursor.requestedAt.getTime())) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, { message: "Approval queue cursor date is invalid" });
		}
		const wanted = Math.min(Math.max(limit, 1), 100);
		const visible: Awaited<ReturnType<DocumentSensitivityChangeRepositoryPort["listPending"]>> = [];
		while (visible.length <= wanted) {
			const batch = await this.changes.listPending(100, databaseCursor);
			if (batch.length === 0) break;
			for (const request of batch) {
				databaseCursor = { requestedAt: request.requestedAt, id: request.id };
				const context = await this.contexts.resolve(request.documentId, actorStaffId);
				if (context.relationships.includes("unit_head") || context.relationships.includes("delegated_unit_head")) visible.push(request);
				if (visible.length > wanted) break;
			}
			if (batch.length < 100 || visible.length > wanted) break;
		}
		const items = visible.slice(0, wanted);
		const last = items.at(-1);
		return {
			items,
			pageInfo: {
				limit: wanted,
				hasMore: visible.length > wanted,
				nextCursor: visible.length > wanted && last
					? OpaqueCursor.encode({ requestedAt: last.requestedAt.toISOString(), id: last.id })
					: null,
			},
		};
	}

	private async evaluate(document: Document, target: GovernanceDocumentSensitivity, reason: string, downgrade: boolean, approved: boolean) {
		const policyId = document.classification.governancePolicyKey;
		const policyVersion = document.classification.governancePolicyVersion;
		if (!policyId || !policyVersion) throw new ApplicationError(ApplicationErrorEnum.POLICY_NOT_FOUND, { message: "Document has no governance-policy binding" });
		const decision = await this.policy.evaluateAction("change_sensitivity", {
			sensitivity: target,
			relationships: ["author"],
			hasRecordedJustification: Boolean(reason),
			isSensitivityDowngrade: downgrade,
			hasDowngradeApproval: approved,
		}, { policyId, policyVersion });
		if (!decision.allowed) throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, { message: "Sensitivity change was denied", details: { reasonCode: decision.reasonCode } });
	}

	private async apply(document: Document, target: GovernanceDocumentSensitivity, actorStaffId: string, expectedRevision: number) {
		document.reclassify({ ...document.classification, sensitivity: target }, actorStaffId);
		return this.transactionManager.execute(async (tx) => {
			const edited = await this.documents.editDocument(document, expectedRevision, tx);
			if (!edited) throw this.stale(document.id, expectedRevision);
			return edited.revision;
		});
	}

	private stale(documentId: string, expectedRevision: number) {
		return new ApplicationError(ApplicationErrorEnum.STALE_GOVERNANCE_DECISION, {
			message: "Document revision changed before sensitivity decision was applied",
			details: { documentId, expectedRevision },
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
		if (!document.classification.governancePolicyKey || !document.classification.governancePolicyVersion) throw new ApplicationError(ApplicationErrorEnum.POLICY_NOT_FOUND, { message: "Document has no governance-policy binding" });
		return document;
	}

	private auditChange(document: Document, actorStaffId: string, from: string, to: string, reason: string, reasonCode: string) {
		const policyId = document.classification.governancePolicyKey;
		const policyVersion = document.classification.governancePolicyVersion;
		if (!policyId || !policyVersion) throw new ApplicationError(ApplicationErrorEnum.POLICY_NOT_FOUND, { message: "Document has no governance-policy binding" });
		return this.audit.record({
			actorStaffId, documentId: document.id, action: "change_sensitivity",
			outcome: "success", reasonCode,
			policyId,
			policyVersion,
			obligations: ["audit_security_event", "audit_justification"],
			metadata: { from, to, reason },
		});
	}
}

export default ManageDocumentSensitivityUseCase;
