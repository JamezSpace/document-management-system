import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";

class GetDocumentByIdUsecase {
    constructor(
        private readonly documentRepo: DocumentRepositoryPort
    ){}

    async execute(docId: string) {
        const doc = await this.documentRepo.findDocumentById(docId);        

        return doc;
    }
}

export default GetDocumentByIdUsecase;