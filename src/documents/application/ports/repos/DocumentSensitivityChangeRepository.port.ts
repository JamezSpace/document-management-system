import type { GovernanceDocumentSensitivity } from "../../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";

interface DocumentSensitivityChangeRecord {
	id: string;
	documentId: string;
	fromSensitivity: GovernanceDocumentSensitivity;
	toSensitivity: GovernanceDocumentSensitivity;
	requestedBy: string;
	reason: string;
	status: "pending" | "approved" | "rejected" | "applied";
	requestedAt: Date;
	reviewedBy: string | null;
	reviewReason: string | null;
	reviewedAt: Date | null;
	appliedAt: Date | null;
}

interface DocumentSensitivityChangeRepositoryPort {
	create(record: Omit<DocumentSensitivityChangeRecord, "reviewedBy" | "reviewReason" | "reviewedAt" | "appliedAt">, tx?: TransactionContext): Promise<DocumentSensitivityChangeRecord>;
	findById(id: string): Promise<DocumentSensitivityChangeRecord | null>;
	markApplied(id: string, reviewedBy: string, reviewReason: string, tx?: TransactionContext): Promise<boolean>;
	markRejected(id: string, reviewedBy: string, reviewReason: string, tx?: TransactionContext): Promise<boolean>;
	listByDocument(documentId: string): Promise<DocumentSensitivityChangeRecord[]>;
	listPending(limit: number, cursor?: { requestedAt: Date; id: string } | null): Promise<DocumentSensitivityChangeRecord[]>;
}

export type { DocumentSensitivityChangeRecord, DocumentSensitivityChangeRepositoryPort };
