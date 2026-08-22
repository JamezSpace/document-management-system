import type { DocumentIdentityPort } from "../../../../shared/application/port/intersubsystem/DocumentIdentity.port.js";
import type { DocumentGovernancePolicyPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import type { DocumentGovernanceContextPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernanceContext.port.js";
import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import Document from "../../../domain/entities/document/Document.js";
import { LifecycleActions } from "../../../domain/enum/lifecycleActions.enum.js";
import { LifecycleState } from "../../../domain/enum/lifecycleState.enum.js";
import type { DocumentEventsPort } from "../../ports/events/DocumentEvents.port.js";
import type { DocumentAddresseeRepositoryPort } from "../../ports/repos/DocumentAddresseeRepository.port.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type { DocumentTypeRepositoryPort } from "../../ports/repos/DocumentTypeRepo.port.js";
import type { DocumentVersionRepositoryPort } from "../../ports/repos/DocumentVersionRepository.port.js";
import type { LifecycleHistoryRepositoryPort } from "../../ports/repos/LifecycleHistoryRepository.port.js";
import type { ReferenceNumberServicePort } from "../../ports/services/ReferenceNumberService.port.js";
import type { RetentionServicePort } from "../../ports/services/RetentionService.port.js";
import type { DocumentTypeForCreation } from "../../types/doc.type.js";

class DocumentCreationUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly documentRepo: DocumentRepositoryPort,
		private readonly documentAddresseeRepo: DocumentAddresseeRepositoryPort,
		private readonly documentVersionRepo: DocumentVersionRepositoryPort,
		private readonly lifecycleHistoryRepo: LifecycleHistoryRepositoryPort,
		private readonly docTypeRepo: DocumentTypeRepositoryPort,
		private readonly documentEvents: DocumentEventsPort,
		private readonly refNumService: ReferenceNumberServicePort,
		private readonly documentIdentity: DocumentIdentityPort,
		private readonly retentionService: RetentionServicePort,
		private readonly documentGovernancePolicy: DocumentGovernancePolicyPort,
		private readonly documentGovernanceContext: DocumentGovernanceContextPort,
		private readonly transactionManager: TransactionManager,
	) {}

	async execute(payload: DocumentTypeForCreation) {
		const uuid = this.idGenerator.generate();
		const docId = "DOC-" + uuid;
		let referenceNumber: string | null = null;

		const docTypeId = payload.classification.documentTypeId;

		const result = await this.transactionManager.execute(
			async (transactionInstance) => {
				const governancePolicy =
					await this.documentGovernancePolicy.getActivePolicyReference();
				const assignmentDecision =
					await this.documentGovernancePolicy.evaluateAction(
						"assign_sensitivity",
						{
							sensitivity: payload.classification.sensitivity,
							relationships: ["author"],
							isAuthenticatedInternalStaff: true,
							hasRequiredClearance:
								await this.documentGovernanceContext.hasRestrictedClearance(
									payload.ownerId,
								),
						},
						governancePolicy,
					);
				if (!assignmentDecision.allowed) {
					throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
						message: "Document sensitivity assignment was denied",
						details: { reasonCode: assignmentDecision.reasonCode },
					});
				}
				const retention = await this.retentionService.computeRetention(
					docTypeId,
					new Date(),
				);

				const documentType =
					await this.docTypeRepo.findDocumentTypeById(
						docTypeId,
						transactionInstance,
					);

				if (!documentType)
					throw new ApplicationError(
						ApplicationErrorEnum.INVALID_CREDENTIALS,
						{
							message: `Document type with id: ${docTypeId} doesnt exist`,
						},
					);

				const primaryAddressee = payload.addressees.find(
					(addr) => addr.isPrimary,
				);

				if (!primaryAddressee) {
					throw new ApplicationError(
						ApplicationErrorEnum.NOT_ALLOWED,
						{
							message: "Primary addressee is required",
						},
					);
				}

				if (documentType.code === "memo") {
					referenceNumber = await this.refNumService.generate({
						year: new Date().getFullYear(),
						subjectCode: payload.correspondence.subjectCode,
						functionCode: payload.classification.functionCode,
						originUnitId: payload.correspondence.originatingUnitId,
						recipientUnitId: primaryAddressee.recipientUnitId,
					});
				}

				if (payload.correspondence.direction === "external") {
					const unitHeadDesignation =
						await this.documentIdentity.resolveUnitHeadDesignation(
							primaryAddressee.recipientUnitId,
						);

					primaryAddressee.addressedToDesignationId = unitHeadDesignation.id;
				}

				const addressees = payload.addressees.map((addressee) => {
					if (!addressee.addressedToDesignationId) {
						throw new ApplicationError(
							ApplicationErrorEnum.INCOMPLETE_REQUEST,
							{
								message: "Addressee designation is required",
								details: {
									recipientUnitId: addressee.recipientUnitId,
								},
							},
						);
					}

					return {
						...addressee,
						addressedToDesignationId: addressee.addressedToDesignationId,
					};
				});

				const newDocument = new Document({
					id: docId,
					version: null,
					retention,
					referenceNumber,
					...payload,
					classification: {
						...payload.classification,
						governancePolicyKey: governancePolicy.policyId,
						governancePolicyVersion: governancePolicy.policyVersion,
					},
					addressees,
				});

				const savedDoc = await this.documentRepo.save(
					newDocument,
					transactionInstance,
				);

				const savedDocAddressees = await Promise.all(
					addressees.map((addr) =>
						this.documentAddresseeRepo.save(
							{
								documentId: docId,
								recipientUnitId: addr.recipientUnitId,
								addressedToDesignationId:
									addr.addressedToDesignationId,
								isPrimary: addr.isPrimary,
							},
							transactionInstance,
						),
					),
				);

				return {
					...savedDoc,
					addressees: savedDocAddressees,
				};
			},
		);

		await this.documentEvents.documentInitialized({
			createdBy: result.ownerId,
			documentId: result.id,
		});

		return result;
	}

	// this assumes document version has not been created but document has been created
	async saveDocument(
		document: Document,
		contentDelta: unknown,
		actorId: string,
		expectedRevision: number,
	) {
		if (document.ownerId !== actorId) {
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Only the document author may edit document content",
				details: { documentId: document.id },
			});
		}
		const uuid = this.idGenerator.generate();

		const version = document.save({ contentDelta, uuid }, actorId);

		const result = await this.transactionManager.execute(
			async (transactionInstance) => {
				const savedVersionedDoc = await this.documentVersionRepo.save(
					version,
					transactionInstance,
				);

				const savedDoc = await this.documentRepo.editDocument(
					document,
					expectedRevision,
					transactionInstance,
				);
				if (!savedDoc) throw new ApplicationError(ApplicationErrorEnum.STALE_GOVERNANCE_DECISION, {
					message: "Document revision no longer matches the supplied If-Match value",
					details: { documentId: document.id, expectedRevision },
				});

				await this.documentAddresseeRepo.deleteByDocumentId(
					document.id,
					transactionInstance,
				);

				const savedDocAddressees = await Promise.all(
					document.addressees.map((addr) =>
						this.documentAddresseeRepo.save(
							{
								documentId: document.id,
								recipientUnitId: addr.recipientUnitId,
								addressedToDesignationId:
									addr.addressedToDesignationId,
								isPrimary: addr.isPrimary,
							},
							transactionInstance,
						),
					),
				);

				await this.lifecycleHistoryRepo.save(
					{
						id: "CYCLE-HSTORY-" + this.idGenerator.generate(),
						action: LifecycleActions.SAVE,
						actorId,
						documentId: savedVersionedDoc.documentId,
						documentVersionId: savedVersionedDoc.id,
						fromState: null,
						toState: LifecycleState.DRAFT,
						metadata: null,
					},
					transactionInstance,
				);

				return { savedDoc, savedVersionedDoc, savedDocAddressees };
			},
		);

		await this.documentEvents.documentVersionCreated({
			documentId: document.id,
			versionedBy: document.ownerId,
		});

		return {
			...result.savedDoc,
			currentVersion: result.savedVersionedDoc,
			addressees: result.savedDocAddressees,
		};
	}
}

export default DocumentCreationUseCase;
