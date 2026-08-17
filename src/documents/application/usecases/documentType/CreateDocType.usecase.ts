import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import DocumentType from "../../../domain/entities/documentType/DocumentType.js";
import type { DocumentTypeEventsPort } from "../../ports/events/DocumentTypeEvents.port.js";
import type { DocumentTypeRepositoryPort } from "../../ports/repos/DocumentTypeRepo.port.js";

class CreateDocumentTypeUsecase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly docTypeRepo: DocumentTypeRepositoryPort,
		private readonly docTypeEvents: DocumentTypeEventsPort,
	) {}

	async createDocType(
		actorId: string,
		payload: {
			code: string;
			name: string;
		},
	) {
		const typeId = "DOC-TYPE-" + this.idGenerator.generate();

		const docType = new DocumentType({
			id: typeId,
			code: payload.code,
			name: payload.name,
		});

		const savedDocType = await this.docTypeRepo.save(docType);

		if (savedDocType)
			await this.docTypeEvents.documentTypeCreated({
				docType: {
					id: typeId,
					name: savedDocType.name,
				},
				actorId,
			});

        return savedDocType;
	}
}

export default CreateDocumentTypeUsecase;
