import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import type DocumentCreationUseCase from "../../../application/usecases/document/CreateDocument.usecase.js";
import type DeleteDocumentUseCase from "../../../application/usecases/document/DeleteDocument.usecase.js";
import type GetAllDocumentsByStaffUseCase from "../../../application/usecases/document/GetAllDocsByStaff.usecase.js";
import type GetDocumentByIdUsecase from "../../../application/usecases/document/GetDocumentById.usecase.js";
import type DocumentSubmission from "../../../application/usecases/document/SubmitDocument.usecase.js";
import Document from "../../../domain/entities/document/Document.js";
import DocumentVersion from "../../../domain/entities/document/DocumentVersion.js";
import { CorrespondenceDirection } from "../../../domain/enum/correspondenceDirection.enum.js";
import type {
    DocumentSchemaType,
    DocumentSchemaTypeForCreation,
} from "../../types/document.type.js";

class DocumentController {
	constructor(
		private readonly createDocumentUseCase: DocumentCreationUseCase,
		private readonly getAllDocsByStaffUsecase: GetAllDocumentsByStaffUseCase,
		private readonly getDocumentByIdUsecase: GetDocumentByIdUsecase,
		private readonly submitDocUsecase: DocumentSubmission,
		private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
	) {}

	structureIncomingPayload(
		payload: DocumentSchemaTypeForCreation,
		actorStaffId: string,
	) {
		return {
			title: payload.title,
			createdBy: actorStaffId,
			action: payload.action,

			correspondence: {
				originatingUnitId: payload.originatingUnitId,
				recipientUnitId: payload.recipientUnitId,
				addressedToDesignationId: payload.addressedToDesignationId,
				subjectCodeId: payload.subjectCodeId,
				subjectCode: payload.subjectCode,
				direction: payload.direction,
			},
			classification: {
				functionCode: payload.functionCode,
				functionCodeId: payload.functionCodeId,
				sensitivity: payload.sensitivity,
				documentTypeId: payload.documentTypeId,
			},
			addressee: {
				recipientUnitId: payload.recipientUnitId,
				addressedToDesignationId: payload.addressedToDesignationId,
			},
		};
	}

	async createDocument(
		payload: DocumentSchemaTypeForCreation,
		actorStaffId: string,
	) {
		const incomingDocument = this.structureIncomingPayload(
			payload,
			actorStaffId,
		);

		// correspondence matters
		if (
			incomingDocument.correspondence.direction ===
			CorrespondenceDirection.EXTERNAL
		) {
			if (!incomingDocument.correspondence.recipientUnitId) {
				throw new ApplicationError(
					ApplicationErrorEnum.INCOMPLETE_REQUEST,
					{
						message: "Recipient unit required",
						details: {
							reason:
								"External correspondence requires a recipient organizational unit",
						},
					},
				);
			}
		}

		if (
			incomingDocument.correspondence.direction ===
				CorrespondenceDirection.INTERNAL &&
			!incomingDocument.correspondence.addressedToDesignationId
		) {
			throw new ApplicationError(
				ApplicationErrorEnum.INCOMPLETE_REQUEST,
				{
					message: "Addressee required",
					details: {
						reason:
							"Internal correspondence requires a responsible addressee",
					},
				},
			);
		}

		const newDoc = await this.createDocumentUseCase.execute({
			title: incomingDocument.title,
			ownerId: incomingDocument.createdBy,
			action: incomingDocument.action,

			classification: {
				functionCodeId: incomingDocument.classification.functionCodeId,
				functionCode: incomingDocument.classification.functionCode,
				sensitivity: incomingDocument.classification.sensitivity,
				documentTypeId: incomingDocument.classification.documentTypeId,
				classifiedBy: incomingDocument.createdBy,
				classifiedAt: new Date(),
			},

			correspondence: {
				originatingUnitId:
					incomingDocument.correspondence.originatingUnitId,
				subjectCodeId: incomingDocument.correspondence.subjectCodeId,
				subjectCode: incomingDocument.correspondence.subjectCode,
				direction: incomingDocument.correspondence.direction,
			},

			addressees: [{
				recipientUnitId: incomingDocument.addressee.recipientUnitId,
				addressedToDesignationId:
					incomingDocument.addressee.addressedToDesignationId,
                isPrimary: true
			}],
		});

        
        
		return newDoc;
	}

	async fetchAllDocsByStaff(staffId: string) {
		const docsByStaff =
			await this.getAllDocsByStaffUsecase.execute(
				staffId,
			);

		return docsByStaff;
	}

	async fetchDocById(docId: string) {
		const doc = await this.getDocumentByIdUsecase.execute(docId);

		return doc;
	}

	async saveDocument(
		doc: DocumentSchemaType,
		contentDelta: unknown,
		actorId: string,
	) {
		let version = null;
		if (doc.currentVersion)
			version = new DocumentVersion({
				...doc.currentVersion,
				createdAt: new Date(doc.createdAt),
				lifecycle: {
					...doc.currentVersion.lifecycle,
					stateEnteredAt: new Date(
						doc.currentVersion.lifecycle.stateEnteredAt,
					),
				},
			});

		const document = new Document({
			...doc,
			version,
			classification: {
				...doc.classification,
				classifiedAt: new Date(doc.classification.classifiedAt),
				lastReclassifiedAt: doc.classification.lastReclassifiedAt
					? new Date(doc.classification.lastReclassifiedAt)
					: null,
			},
			retention: {
				...doc.retention,
				retentionStartDate: new Date(doc.retention.retentionStartDate),
				disposalEligibilityDate: new Date(
					doc.retention.disposalEligibilityDate,
				),
			},
			createdAt: new Date(doc.createdAt),
			updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : null,
		});

		const savedDoc = await this.createDocumentUseCase.saveDocument(
			document,
			contentDelta,
			actorId,
		);

		return savedDoc;
	}

	async saveDocumentContent(
		documentId: string,
		contentDelta: unknown,
		actorId: string,
	) {
		const document = await this.getDocumentByIdUsecase.execute(documentId);

		if (!document) return null;

		return this.createDocumentUseCase.saveDocument(
			document,
			contentDelta,
			actorId,
		);
	}

	async submitDocument(actorId: string, doc: DocumentSchemaType) {
		const version = doc.currentVersion
			? new DocumentVersion({
					id: doc.currentVersion.id,
					documentId: doc.id,
					contentDelta: doc.currentVersion.contentDelta,
					versionNumber: doc.currentVersion.versionNumber,
					mediaId: doc.currentVersion.mediaId ?? null,
					createdAt: new Date(doc.currentVersion.createdAt),
					createdBy: doc.currentVersion.createdBy,
					lifecycle: {
						currentState: doc.currentVersion.lifecycle.currentState,
						stateEnteredAt: new Date(
							doc.currentVersion.lifecycle.stateEnteredAt,
						),
						stateEnteredBy:
							doc.currentVersion.lifecycle.stateEnteredBy,
					},
				})
			: null;

		const document = {
			...doc,
			// addressee: {
			// 	recipientUnitId: doc.addressee.recipientUnitId,
			// 	addressedToDesignationId:
			// 		doc.addressee.addressedToDesignationId,
			// },
			classification: {
				...doc.classification,
				classifiedAt: new Date(doc.classification.classifiedAt),
				lastReclassifiedAt: doc.classification.lastReclassifiedAt
					? new Date(doc.classification.lastReclassifiedAt)
					: null,
			},
			retention: {
				...doc.retention,
				retentionStartDate: new Date(doc.retention.retentionStartDate),
				disposalEligibilityDate: new Date(
					doc.retention.disposalEligibilityDate,
				),
			},
			createdAt: new Date(doc.createdAt),
			updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : null,
		};

		const submittedDocument = await this.submitDocUsecase.submitDocument(
			actorId,
			new Document({ ...document, version }),
		);

		return submittedDocument;
	}

	async submitDocumentById(documentId: string, actorId: string) {
		const document = await this.getDocumentByIdUsecase.execute(documentId);

		if (!document) return null;

		return this.submitDocUsecase.submitDocument(actorId, document);
	}

	async deleteDocument(documentId: string, deletedBy: string) {
		await this.deleteDocumentUseCase.deleteDocument({
			documentId,
			deletedBy,
		});

		return {
			documentId,
			deleted: true,
		};
	}
}

export default DocumentController;
