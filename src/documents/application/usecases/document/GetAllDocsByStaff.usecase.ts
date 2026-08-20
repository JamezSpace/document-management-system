import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type DocumentGovernanceGuard from "../../services/DocumentGovernanceGuard.service.js";

class GetAllDocumentsByStaffUseCase {
	constructor(
		private readonly documentsRepo: DocumentRepositoryPort,
		private readonly governance: DocumentGovernanceGuard,
	) {}

    async execute(staffId:string) {
        const allDocsByStaff = await this.documentsRepo.fetchDocumentsByStaff(staffId);

		const visible = await Promise.all(
			allDocsByStaff.map(async (document) => {
				try {
					await this.governance.authorize(document, staffId, "discover");
					return document;
				} catch (error: unknown) {
					if (
						typeof error === "object" &&
						error !== null &&
						"errorCode" in error &&
						error.errorCode === "not_allowed"
					) return null;
					throw error;
				}
			}),
		);
		return visible.filter((document) => document !== null);
    }
}

export default GetAllDocumentsByStaffUseCase;
