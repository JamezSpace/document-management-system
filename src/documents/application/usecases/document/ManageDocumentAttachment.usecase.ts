import type { TransactionManager } from "../../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import { LifecycleState } from "../../../domain/enum/lifecycleState.enum.js";
import type { DocumentMediaRepositoryPort } from "../../ports/repos/DocumentMediaRepository.port.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type DocumentGovernanceGuard from "../../services/DocumentGovernanceGuard.service.js";

class ManageDocumentAttachmentUseCase {
	constructor(
		private readonly documents: DocumentRepositoryPort,
		private readonly attachments: DocumentMediaRepositoryPort,
		private readonly governance: DocumentGovernanceGuard,
		private readonly transactionManager: TransactionManager,
	) {}

	async attach(payload: {
		documentId: string;
		mediaId: string;
		actorStaffId: string;
		expectedRevision: number;
	}) {
		const document = await this.requireDocument(payload.documentId);
		await this.governance.authorize(document, payload.actorStaffId, "attach");
		this.ensureAttachmentState(document.getCurrentVersion()?.getState() ?? null);

		const documentRevision = await this.transactionManager.execute(async (tx) => {
			const ownsMedia = await this.attachments.mediaExistsForUploader(
				payload.mediaId,
				payload.actorStaffId,
				tx,
			);
			if (!ownsMedia) {
				throw new ApplicationError(ApplicationErrorEnum.MEDIA_NOT_FOUND, {
					message: "Active media owned by the requester was not found",
					details: { mediaId: payload.mediaId },
				});
			}
			await this.attachments.save(
				{
					documentId: payload.documentId,
					documentVersionId: document.getCurrentVersion()?.id ?? null,
					mediaId: payload.mediaId,
					assetRole: "attachment",
				},
				tx,
			);
			const revision = await this.documents.incrementRevision(payload.documentId, payload.expectedRevision, tx);
			if (!revision) throw new ApplicationError(ApplicationErrorEnum.STALE_GOVERNANCE_DECISION, {
				message: "Document revision changed before attachment was added",
				details: { documentId: payload.documentId, expectedRevision: payload.expectedRevision },
			});
			return revision;
		});

		return { attachments: await this.attachments.listByDocument(payload.documentId), documentRevision };
	}

	async list(documentId: string, actorStaffId: string) {
		const document = await this.requireDocument(documentId);
		await this.governance.authorize(document, actorStaffId, "view");
		return this.attachments.listByDocument(documentId);
	}

	async remove(documentId: string, mediaId: string, actorStaffId: string, expectedRevision: number) {
		const document = await this.requireDocument(documentId);
		await this.governance.authorize(document, actorStaffId, "attach");
		if (document.ownerId !== actorStaffId) {
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Only the document author may remove an attachment",
			});
		}
		return this.transactionManager.execute(async (tx) => {
			const removed = await this.attachments.remove(documentId, mediaId, tx);
			if (!removed) return false;
			const revision = await this.documents.incrementRevision(documentId, expectedRevision, tx);
			if (!revision) throw new ApplicationError(ApplicationErrorEnum.STALE_GOVERNANCE_DECISION, {
				message: "Document revision changed before attachment removal",
				details: { documentId, expectedRevision },
			});
			return { removed: true, documentRevision: revision };
		});
	}

	private async requireDocument(documentId: string) {
		const document = await this.documents.findDocumentById(documentId);
		if (!document) {
			throw new ApplicationError(ApplicationErrorEnum.DOCUMENT_NOT_FOUND, {
				message: `Document with id ${documentId} doesn't exist.`,
			});
		}
		return document;
	}

	private ensureAttachmentState(state: LifecycleState | null) {
		if (![null, LifecycleState.DRAFT, LifecycleState.IN_REVIEW].includes(state)) {
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Attachments are closed for the document's current lifecycle state",
			});
		}
	}
}

export default ManageDocumentAttachmentUseCase;
