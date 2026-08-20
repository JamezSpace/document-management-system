import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type DocumentGovernanceGuard from "../../services/DocumentGovernanceGuard.service.js";

class GetDocumentByIdUsecase {
    constructor(
        private readonly documentRepo: DocumentRepositoryPort,
		private readonly governance: DocumentGovernanceGuard,
    ){}

	async execute(docId: string, actorStaffId?: string) {
        const doc = await this.documentRepo.findDocumentById(docId);        
		if (doc && actorStaffId) {
			await this.governance.authorize(doc, actorStaffId, "view");
		}

        return doc;
    }
}

export default GetDocumentByIdUsecase;
