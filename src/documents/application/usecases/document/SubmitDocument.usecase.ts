import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import Document from "../../../domain/entities/document/Document.js";
import { CorrespondenceDirection } from "../../../domain/enum/correspondenceDirection.enum.js";
import { LifecycleActions } from "../../../domain/enum/lifecycleActions.enum.js";
import { LifecycleState } from "../../../domain/enum/lifecycleState.enum.js";
import type { DocumentEventsPort } from "../../ports/events/DocumentEvents.port.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type { DocumentVersionRepositoryPort } from "../../ports/repos/DocumentVersionRepository.port.js";
import type { LifecycleHistoryRepositoryPort } from "../../ports/repos/LifecycleHistoryRepository.port.js";

class DocumentSubmissionUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly documentRepo: DocumentRepositoryPort,
		private readonly documentVersionRepo: DocumentVersionRepositoryPort,
		private readonly lifecycleHistoryRepo: LifecycleHistoryRepositoryPort,
		private readonly documentEvents: DocumentEventsPort,
		private readonly transactionManager: TransactionManager,
	) {}

	async submitDocument(actorId: string, document: Document) {
		const versionedDocument = document.getCurrentVersion();

		// this affirms that documents that have been versioned can be submitted
		if (!versionedDocument)
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Only versioned documents can be submitted",
			});

		const docDirection = document.correspondence.direction;
		const previousState = versionedDocument.getState();
		const toState = docDirection === CorrespondenceDirection.INTERNAL ? LifecycleState.ACTIVE : LifecycleState.IN_REVIEW;

		// this only changes the state within the domain not the database
		versionedDocument.submit(actorId, docDirection);

		const result = await this.transactionManager.execute(
			async (transactionInstance) => {
				// this persists the changed document state to database
				await this.documentVersionRepo.editVersionedDocument(
					versionedDocument,
					transactionInstance,
				);

				await this.lifecycleHistoryRepo.save(
					{
						id: "CYCLE-HSTORY-" + this.idGenerator.generate(),
						action: LifecycleActions.SUBMIT,
						actorId,
						documentId: versionedDocument.documentId,
						documentVersionId: versionedDocument.id,
						fromState: previousState,
						toState,
						metadata: null,
					},
					transactionInstance,
				);

                // storing addresse here so it doesn't get lost during edit of the document
                const docAddressees = document.addressees;
				const submittedDocument = await this.documentRepo.editDocument(
					document,
					transactionInstance,
				);                

                return submittedDocument && {
                    ...submittedDocument,
                    addressees: docAddressees
                };
			},
		);

		// emit document submitted event
        if(!result) return null;
        const {direction} = result.correspondence;
		if (direction === CorrespondenceDirection.EXTERNAL)
			await this.documentEvents.documentSubmitted({
				documentId: document.id,
				lifecycleState: versionedDocument.lifecycle.currentState,
				submittedBy: actorId,
			});
        else
            await this.documentEvents.documentActivated({
                documentId: document.id,
                activatedBy: actorId,
            });

		return result;
		// TODO: carefully factor in document editing process. Questions to consider
		// 1. Can anyone with a higher authority edit a document created by a person of lower authority or it is he who creates that can be the only one that edits??
	}
}

export default DocumentSubmissionUseCase;
