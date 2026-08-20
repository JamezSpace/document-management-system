interface SaveDocumentMediaPayload {
	documentId: string;
	mediaId: string;
	assetRole: string;
	documentVersionId?: string | null;
	assignedAt?: Date;
}

interface DocumentMediaRepositoryPort {
	save(payload: SaveDocumentMediaPayload, tx?: TransactionContext): Promise<void>;
	mediaExistsForUploader(
		mediaId: string,
		uploadedBy: string,
		tx?: TransactionContext,
	): Promise<boolean>;
	listByDocument(documentId: string): Promise<DocumentAttachmentRecord[]>;
	remove(
		documentId: string,
		mediaId: string,
		tx?: TransactionContext,
	): Promise<boolean>;
}

interface DocumentAttachmentRecord {
	documentId: string;
	documentVersionId: string | null;
	mediaId: string;
	assetRole: string;
	assignedAt: Date;
	mimeType: string;
	sizeBytes: number;
	checksum: string;
}

export type {
	DocumentAttachmentRecord,
	DocumentMediaRepositoryPort,
	SaveDocumentMediaPayload,
};
import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
