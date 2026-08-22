import type Document from "../../../domain/entities/document/Document.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type DocumentGovernanceGuard from "../../services/DocumentGovernanceGuard.service.js";
import NexusError from "../../../../shared/errors/NexusError.js";
import OpaqueCursor from "../../services/OpaqueCursor.service.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";

class DiscoverDocumentsUseCase {
	constructor(
		private readonly documents: DocumentRepositoryPort,
		private readonly governance: DocumentGovernanceGuard,
	) {}

	async execute(searchTerm: string, actorStaffId: string, requestedLimit = 25, cursor?: string) {
		const term = searchTerm.trim();
		if (!term) return { items: [], pageInfo: { limit: requestedLimit, hasMore: false, nextCursor: null } };
		const limit = Math.min(Math.max(requestedLimit, 1), 100);
		const parsed = OpaqueCursor.decode(cursor, ["createdAt", "id"]);
		let databaseCursor = parsed
			? { createdAt: new Date(parsed.createdAt!), id: parsed.id! }
			: null;
		if (databaseCursor && Number.isNaN(databaseCursor.createdAt.getTime())) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, { message: "Search cursor date is invalid" });
		}
		const visible: Document[] = [];
		while (visible.length <= limit) {
			const candidates = await this.documents.discover(term, 100, databaseCursor);
			if (candidates.length === 0) break;
			for (const document of candidates) {
				databaseCursor = { createdAt: document.createdAt, id: document.id };
				try {
					await this.governance.authorize(document, actorStaffId, "discover");
					visible.push(document);
				} catch (error) {
					if (!(error instanceof NexusError) || ![
						"not_allowed",
						"governance_grant_expired",
						"governance_grant_revoked",
					].includes(error.errorCode)) throw error;
				}
				if (visible.length > limit) break;
			}
			if (candidates.length < 100 || visible.length > limit) break;
		}
		const items = visible.slice(0, limit).map((document) => ({
			id: document.id,
			title: document.title,
			referenceNumber: document.referenceNumber,
			sensitivity: document.classification.sensitivity,
			createdAt: document.createdAt,
			revision: document.revision,
		}));
		const last = visible.slice(0, limit).at(-1);
		return {
			items,
			pageInfo: {
				limit,
				hasMore: visible.length > limit,
				nextCursor: visible.length > limit && last
					? OpaqueCursor.encode({ createdAt: last.createdAt.toISOString(), id: last.id })
					: null,
			},
		};
	}
}

export default DiscoverDocumentsUseCase;
