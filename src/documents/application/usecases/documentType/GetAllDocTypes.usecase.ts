import type { DocumentTypeRepositoryPort } from "../../ports/repos/DocumentTypeRepo.port.js";

class GetAllDocumentTypesUsecase {
    constructor(
		private readonly docTypeRepo: DocumentTypeRepositoryPort,
	) {}

    async getAll() {
        return this.docTypeRepo.fetchAll()
    }
}

export default GetAllDocumentTypesUsecase;