import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import { LifecycleActions } from "../../../domain/enum/lifecycleActions.enum.js";
import { LifecycleState } from "../../../domain/enum/lifecycleState.enum.js";
import type LifecycleHistory from "../../../domain/valueobjects/LifecycleHistory.js";
import type { DocumentEventsPort } from "../../ports/events/DocumentEvents.port.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type { LifecycleHistoryRepositoryPort } from "../../ports/repos/LifecycleHistoryRepository.port.js";

class DeleteDocumentUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly documentRepo: DocumentRepositoryPort,
		private readonly lifecycleHistoryRepo: LifecycleHistoryRepositoryPort,
		private readonly documentEvents: DocumentEventsPort,
	) {}

	async deleteDocument(payload: { documentId: string; deletedBy: string }) {
		const doc = await this.documentRepo.findDocumentById(payload.documentId);

		if (!doc) {
			throw new ApplicationError(ApplicationErrorEnum.DOCUMENT_NOT_FOUND, {
				message: `Document with id ${payload.documentId} doesn't exist.`,
				details: { documentId: payload.documentId },
			});
		}

		const version = doc.getCurrentVersion();

		if (version && version.getState().toLowerCase() !== LifecycleState.DRAFT) {
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Only draft documents can be deleted.",
				details: {
					documentId: payload.documentId,
					currentState: version.getState(),
				},
			});
		}

		await this.documentRepo.hardDeleteDocument(payload.documentId);

        const lifecycleHistoryRepoPayload: Omit<LifecycleHistory, 'documentVersionId' | 'documentId'> = {
            id: "CYCLE-HSTORY-" + this.idGenerator.generate(),
            action: LifecycleActions.DELETE,
            actorId: payload.deletedBy,
            fromState: null,
            toState: LifecycleState.DRAFT,
            metadata: null
        }

        if(version)
            await this.lifecycleHistoryRepo.save({
                ...lifecycleHistoryRepoPayload,
                documentVersionId: version.documentId,
                documentId: version.documentId
            })
        else
            await this.lifecycleHistoryRepo.save({
                ...lifecycleHistoryRepoPayload,
                documentId: payload.documentId,
                documentVersionId: null
            })


		await this.documentEvents.documentDeleted({
			documentId: payload.documentId,
			deletedBy: payload.deletedBy,
		});
	}
}

export default DeleteDocumentUseCase;
