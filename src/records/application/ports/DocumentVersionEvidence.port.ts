interface FrozenDocumentVersion {
	documentId: string;
	documentVersionId: string;
	checksum: string;
}

interface DocumentVersionEvidencePort {
	resolveFrozenVersion(
		documentId: string,
		documentVersionId: string,
	): Promise<FrozenDocumentVersion | null>;
}

export type { DocumentVersionEvidencePort, FrozenDocumentVersion };
