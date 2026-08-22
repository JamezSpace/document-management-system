import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";

interface DocumentExtractionRecord {
	id: string;
	documentId: string;
	documentRevision: number;
	actorStaffId: string;
	action: "export" | "print";
	grantId: string | null;
	policyId: string;
	policyVersion: number;
	obligations: string[];
	watermarkText: string | null;
	artifactSha256: string;
}

interface DocumentExtractionRepositoryPort {
	record(value: DocumentExtractionRecord, tx: TransactionContext): Promise<void>;
}

export type { DocumentExtractionRecord, DocumentExtractionRepositoryPort };
