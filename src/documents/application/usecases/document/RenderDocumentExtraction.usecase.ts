import { createHash } from "node:crypto";
import type { DocumentGovernanceGrantRepositoryPort } from "../../ports/repos/DocumentGovernanceGrantRepository.port.js";
import type { DocumentExtractionRepositoryPort } from "../../ports/repos/DocumentExtractionRepository.port.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import NexusError from "../../../../shared/errors/NexusError.js";
import type DocumentGovernanceGuard from "../../services/DocumentGovernanceGuard.service.js";
import DocumentPdfRenderer from "../../services/DocumentPdfRenderer.service.js";
import { LifecycleState } from "../../../domain/enum/lifecycleState.enum.js";

class RenderDocumentExtractionUseCase {
	constructor(
		private readonly ids: IdGeneratorPort,
		private readonly documents: DocumentRepositoryPort,
		private readonly grants: DocumentGovernanceGrantRepositoryPort,
		private readonly extractions: DocumentExtractionRepositoryPort,
		private readonly governance: DocumentGovernanceGuard,
		private readonly transactions: TransactionManager,
	) {}

	async execute(documentId: string, actorStaffId: string, action: "export" | "print", expectedRevision: number) {
		const document = await this.documents.findDocumentById(documentId);
		if (!document) throw new ApplicationError(ApplicationErrorEnum.DOCUMENT_NOT_FOUND, { message: "Document was not found" });
		if (document.revision !== expectedRevision) throw this.stale(documentId, expectedRevision);
		if (document.getCurrentVersion()?.getState() !== LifecycleState.ACTIVE) {
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, { message: "Only active documents can be exported or printed" });
		}

		let authorization;
		try {
			authorization = await this.governance.authorize(document, actorStaffId, action);
		} catch (error) {
			if (document.classification.sensitivity === "confidential" && error instanceof NexusError && error.errorCode === "not_allowed") {
				await this.throwGrantReason(documentId, actorStaffId);
			}
			throw error;
		}

		const obligations = authorization.decision.obligations;
		const renderedAt = new Date();
		const watermarkText = this.watermark(obligations, actorStaffId, documentId, renderedAt);
		const artifact = DocumentPdfRenderer.render(document, watermarkText);
		const artifactSha256 = createHash("sha256").update(artifact).digest("hex");

		const consumption = await this.transactions.execute(async (tx) => {
			if (!(await this.documents.lockRevision(documentId, expectedRevision, tx))) throw this.stale(documentId, expectedRevision);
			let consumedGrantId: string | null = null;
			if (document.classification.sensitivity === "confidential") {
				const grant = await this.grants.consumeActiveExport(documentId, actorStaffId, tx);
				if (!grant) await this.throwGrantReason(documentId, actorStaffId);
				consumedGrantId = grant!.id;
			}
			await this.extractions.record({
				id: `DOC-EXTRACT-${this.ids.generate()}`,
				documentId,
				documentRevision: expectedRevision,
				actorStaffId,
				action,
				grantId: consumedGrantId,
				policyId: authorization.decision.policyId,
				policyVersion: authorization.decision.policyVersion,
				obligations,
				watermarkText,
				artifactSha256,
			}, tx);
			const finalRevision = consumedGrantId
				? await this.documents.incrementRevision(documentId, expectedRevision, tx)
				: expectedRevision;
			if (!finalRevision) throw this.stale(documentId, expectedRevision);
			return { grantId: consumedGrantId, finalRevision };
		});

		const safeName = (document.referenceNumber ?? document.id).replace(/[^a-zA-Z0-9._-]/g, "_");
		return {
			artifact,
			fileName: `${safeName}.pdf`,
			contentType: "application/pdf",
			disposition: action === "print" ? "inline" as const : "attachment" as const,
			artifactSha256,
			grantId: consumption.grantId,
			obligations,
			policyId: authorization.decision.policyId,
			policyVersion: authorization.decision.policyVersion,
			documentRevision: consumption.finalRevision,
		};
	}

	private async throwGrantReason(documentId: string, actorStaffId: string): Promise<never> {
		const grants = (await this.grants.listByDocument(documentId))
			.filter((grant) => grant.granteeStaffId === actorStaffId && grant.grantType === "export");
		if (grants.some((grant) => grant.status === "exhausted")) throw new ApplicationError(ApplicationErrorEnum.GRANT_EXHAUSTED, { message: "Confidential export grant has no remaining uses" });
		if (grants.some((grant) => grant.status === "expired")) throw new ApplicationError(ApplicationErrorEnum.GRANT_EXPIRED, { message: "Confidential export grant has expired" });
		if (grants.some((grant) => grant.status === "revoked")) throw new ApplicationError(ApplicationErrorEnum.GRANT_REVOKED, { message: "Confidential export grant was revoked" });
		if (grants.some((grant) => grant.status === "active")) throw new ApplicationError(ApplicationErrorEnum.STALE_GOVERNANCE_DECISION, { message: "Export grant state changed concurrently; refresh and retry" });
		throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, { message: "An active confidential export grant is required" });
	}

	private watermark(obligations: string[], actorStaffId: string, documentId: string, at: Date) {
		if (obligations.includes("identity_timestamp_watermark")) return `NexusFons confidential | ${actorStaffId} | ${at.toISOString()} | ${documentId}`;
		if (obligations.includes("internal_traceability_watermark")) return `NexusFons internal trace | ${actorStaffId} | ${at.toISOString()} | ${documentId}`;
		return null;
	}

	private stale(documentId: string, expectedRevision: number) {
		return new ApplicationError(ApplicationErrorEnum.STALE_GOVERNANCE_DECISION, {
			message: "Document revision no longer matches the extraction decision",
			details: { documentId, expectedRevision },
		});
	}
}

export default RenderDocumentExtractionUseCase;
