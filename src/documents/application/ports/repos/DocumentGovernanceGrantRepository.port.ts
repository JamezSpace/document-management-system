import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";

type DocumentGovernanceGrantType = "guest_reader" | "export";
type DocumentGovernanceGrantStatus = "active" | "expired" | "exhausted" | "revoked";

interface DocumentGovernanceGrantRecord {
	id: string;
	documentId: string;
	granteeStaffId: string;
	grantType: DocumentGovernanceGrantType;
	grantedBy: string;
	grantorAuthority: "originator" | "unit_head";
	reason: string;
	validFrom: Date;
	validTo: Date | null;
	remainingUses: number | null;
	status: DocumentGovernanceGrantStatus;
	revokedBy: string | null;
	revokedAt: Date | null;
	revocationReason: string | null;
	createdAt: Date;
}

interface DocumentGovernanceGrantRepositoryPort {
	create(record: Omit<DocumentGovernanceGrantRecord, "status" | "revokedBy" | "revokedAt" | "revocationReason" | "createdAt">, tx?: TransactionContext): Promise<DocumentGovernanceGrantRecord>;
	findById(id: string): Promise<DocumentGovernanceGrantRecord | null>;
	revoke(id: string, actorStaffId: string, reason: string, tx?: TransactionContext): Promise<boolean>;
	listByDocument(documentId: string): Promise<DocumentGovernanceGrantRecord[]>;
	consumeActiveExport(documentId: string, staffId: string, tx: TransactionContext): Promise<DocumentGovernanceGrantRecord | null>;
}

export type {
	DocumentGovernanceGrantRecord,
	DocumentGovernanceGrantRepositoryPort,
	DocumentGovernanceGrantType,
	DocumentGovernanceGrantStatus,
};
