import type { DocumentTypeRepositoryPort } from "../../ports/repos/DocumentTypeRepo.port.js";

class GetDocumentTypeByIdUsecase {
	constructor(private readonly docTypeRepo: DocumentTypeRepositoryPort) {}

	async getDocTypeById(typeId: string) {
		const docType = await this.docTypeRepo.findDocumentTypeById(typeId);

		return docType;
	}
}

export default GetDocumentTypeByIdUsecase;
