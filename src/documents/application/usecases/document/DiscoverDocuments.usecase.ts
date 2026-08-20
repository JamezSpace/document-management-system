import type Document from "../../../domain/entities/document/Document.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type DocumentGovernanceGuard from "../../services/DocumentGovernanceGuard.service.js";
import NexusError from "../../../../shared/errors/NexusError.js";

class DiscoverDocumentsUseCase {
	constructor(
		private readonly documents: DocumentRepositoryPort,
		private readonly governance: DocumentGovernanceGuard,
	) {}

	async execute(searchTerm: string, actorStaffId: string, requestedLimit = 25) {
		const term = searchTerm.trim();
		if (!term) return [];
		const limit = Math.min(Math.max(requestedLimit, 1), 100);
		const candidates = await this.documents.discover(term, limit * 3);
		const visible: Document[] = [];

		for (const document of candidates) {
			try {
				await this.governance.authorize(document, actorStaffId, "discover");
				visible.push(document);
			} catch (error) {
				// Discovery is intentionally non-revealing: denied records do not expose
				// their existence, title, reference, or classification to the caller.
				if (!(error instanceof NexusError) || error.errorCode !== "not_allowed") throw error;
			}
			if (visible.length === limit) break;
		}

		return visible.map((document) => ({
			id: document.id,
			title: document.title,
			referenceNumber: document.referenceNumber,
			sensitivity: document.classification.sensitivity,
			createdAt: document.createdAt,
		}));
	}
}

export default DiscoverDocumentsUseCase;
