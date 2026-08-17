interface SaveDocumentMediaPayload {
	documentId: string;
	mediaId: string;
	assetRole: string;
	documentVersionId?: string | null;
	assignedAt?: Date;
}

interface DocumentMediaRepositoryPort {
	save(payload: SaveDocumentMediaPayload): Promise<void>;
}

export type { DocumentMediaRepositoryPort, SaveDocumentMediaPayload };
