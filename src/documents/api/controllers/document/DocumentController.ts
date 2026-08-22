import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import type DocumentCreationUseCase from "../../../application/usecases/document/CreateDocument.usecase.js";
import type DeleteDocumentUseCase from "../../../application/usecases/document/DeleteDocument.usecase.js";
import type GetAllDocumentsByStaffUseCase from "../../../application/usecases/document/GetAllDocsByStaff.usecase.js";
import type GetDocumentByIdUsecase from "../../../application/usecases/document/GetDocumentById.usecase.js";
import type DocumentSubmission from "../../../application/usecases/document/SubmitDocument.usecase.js";
import type ManageDocumentAttachmentUseCase from "../../../application/usecases/document/ManageDocumentAttachment.usecase.js";
import type SignDocumentAsUnitHeadUseCase from "../../../application/usecases/document/SignDocumentAsUnitHead.usecase.js";
import type ManageDocumentGovernanceGrantUseCase from "../../../application/usecases/document/ManageDocumentGovernanceGrant.usecase.js";
import type ManageDocumentSensitivityUseCase from "../../../application/usecases/document/ManageDocumentSensitivity.usecase.js";
import type DiscoverDocumentsUseCase from "../../../application/usecases/document/DiscoverDocuments.usecase.js";
import type RenderDocumentExtractionUseCase from "../../../application/usecases/document/RenderDocumentExtraction.usecase.js";
import type { GovernanceDocumentSensitivity } from "../../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import type { DocumentGovernanceGrantType } from "../../../application/ports/repos/DocumentGovernanceGrantRepository.port.js";
import { CorrespondenceDirection } from "../../../domain/enum/correspondenceDirection.enum.js";
import type {
    DocumentSchemaTypeForCreation,
} from "../../types/document.type.js";

class DocumentController {
	constructor(
		private readonly createDocumentUseCase: DocumentCreationUseCase,
		private readonly getAllDocsByStaffUsecase: GetAllDocumentsByStaffUseCase,
		private readonly getDocumentByIdUsecase: GetDocumentByIdUsecase,
		private readonly submitDocUsecase: DocumentSubmission,
		private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
		private readonly manageDocumentAttachmentUseCase: ManageDocumentAttachmentUseCase,
		private readonly signDocumentAsUnitHeadUseCase: SignDocumentAsUnitHeadUseCase,
		private readonly manageDocumentGovernanceGrantUseCase: ManageDocumentGovernanceGrantUseCase,
		private readonly manageDocumentSensitivityUseCase: ManageDocumentSensitivityUseCase,
		private readonly discoverDocumentsUseCase: DiscoverDocumentsUseCase,
		private readonly renderDocumentExtractionUseCase: RenderDocumentExtractionUseCase,
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

	async fetchDocById(docId: string, actorStaffId: string) {
		const doc = await this.getDocumentByIdUsecase.execute(docId, actorStaffId);

		return doc;
	}

	async saveDocumentContent(
		documentId: string,
		contentDelta: unknown,
		actorId: string,
		expectedRevision: number,
	) {
		const document = await this.getDocumentByIdUsecase.execute(documentId, actorId);

		if (!document) return null;

		return this.createDocumentUseCase.saveDocument(
			document,
			contentDelta,
			actorId,
			expectedRevision,
		);
	}

	async submitDocumentById(documentId: string, actorId: string, expectedRevision: number) {
		const document = await this.getDocumentByIdUsecase.execute(documentId, actorId);

		if (!document) return null;

		return this.submitDocUsecase.submitDocument(actorId, document, expectedRevision);
	}

	async deleteDocument(documentId: string, deletedBy: string, expectedRevision: number) {
		await this.deleteDocumentUseCase.deleteDocument({
			documentId,
			deletedBy,
			expectedRevision,
		});

		return {
			documentId,
			deleted: true,
		};
	}

	attachMedia(
		documentId: string,
		mediaId: string,
		actorStaffId: string,
		expectedRevision: number,
	) {
		return this.manageDocumentAttachmentUseCase.attach({
			documentId,
			mediaId,
			actorStaffId,
			expectedRevision,
		});
	}

	listAttachments(documentId: string, actorStaffId: string) {
		return this.manageDocumentAttachmentUseCase.list(documentId, actorStaffId);
	}

	removeAttachment(
		documentId: string,
		mediaId: string,
		actorStaffId: string,
		expectedRevision: number,
	) {
		return this.manageDocumentAttachmentUseCase.remove(
			documentId,
			mediaId,
			actorStaffId,
			expectedRevision,
		);
	}

	signAsEffectiveUnitHead(documentId: string, actorStaffId: string, expectedRevision: number) {
		return this.signDocumentAsUnitHeadUseCase.execute(documentId, actorStaffId, expectedRevision);
	}

	discover(searchTerm: string, actorStaffId: string, limit?: number, cursor?: string) {
		return this.discoverDocumentsUseCase.execute(searchTerm, actorStaffId, limit, cursor);
	}

	createGovernanceGrant(documentId: string, payload: {
		granteeStaffId: string;
		grantType: DocumentGovernanceGrantType;
		reason: string;
		validTo?: string | null;
		remainingUses?: number | null;
	}, actorStaffId: string, expectedRevision: number) {
		return this.manageDocumentGovernanceGrantUseCase.grant({
			...payload,
			documentId,
			actorStaffId,
			validTo: payload.validTo ? new Date(payload.validTo) : null,
			expectedRevision,
		});
	}

	revokeGovernanceGrant(documentId: string, grantId: string, reason: string, actorStaffId: string, expectedRevision: number) {
		return this.manageDocumentGovernanceGrantUseCase.revoke(documentId, grantId, actorStaffId, reason, expectedRevision);
	}

	listGovernanceGrants(documentId: string, actorStaffId: string) {
		return this.manageDocumentGovernanceGrantUseCase.list(documentId, actorStaffId);
	}

	requestSensitivityChange(documentId: string, targetSensitivity: GovernanceDocumentSensitivity, reason: string, actorStaffId: string, expectedRevision: number) {
		return this.manageDocumentSensitivityUseCase.requestChange(documentId, actorStaffId, targetSensitivity, reason, expectedRevision);
	}

	approveSensitivityChange(documentId: string, requestId: string, reason: string, actorStaffId: string, expectedRevision: number) {
		return this.manageDocumentSensitivityUseCase.approve(documentId, requestId, actorStaffId, reason, expectedRevision);
	}

	rejectSensitivityChange(documentId: string, requestId: string, reason: string, actorStaffId: string, expectedRevision: number) {
		return this.manageDocumentSensitivityUseCase.reject(documentId, requestId, actorStaffId, reason, expectedRevision);
	}

	listSensitivityChanges(documentId: string, actorStaffId: string) {
		return this.manageDocumentSensitivityUseCase.listByDocument(documentId, actorStaffId);
	}

	sensitivityApprovalQueue(actorStaffId: string, limit?: number, cursor?: string) {
		return this.manageDocumentSensitivityUseCase.approvalQueue(actorStaffId, limit, cursor);
	}

	renderExtraction(documentId: string, actorStaffId: string, action: "export" | "print", expectedRevision: number) {
		return this.renderDocumentExtractionUseCase.execute(documentId, actorStaffId, action, expectedRevision);
	}
}

export default DocumentController;
