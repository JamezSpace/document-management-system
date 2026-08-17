import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";

class GetAllDocumentsByStaffUseCase {
    constructor(private readonly documentsRepo: DocumentRepositoryPort){}

    async execute(staffId:string) {
        const allDocsByStaff = await this.documentsRepo.fetchDocumentsByStaff(staffId);

        return allDocsByStaff;
    }
}

export default GetAllDocumentsByStaffUseCase;