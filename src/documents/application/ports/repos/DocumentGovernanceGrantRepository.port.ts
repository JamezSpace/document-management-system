import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";

type DocumentGovernanceGrantType = "guest_reader" | "export";

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
}

interface DocumentGovernanceGrantRepositoryPort {
	create(record: DocumentGovernanceGrantRecord, tx?: TransactionContext): Promise<DocumentGovernanceGrantRecord>;
	findById(id: string): Promise<DocumentGovernanceGrantRecord | null>;
	revoke(id: string, actorStaffId: string, reason: string, tx?: TransactionContext): Promise<boolean>;
}

export type {
	DocumentGovernanceGrantRecord,
	DocumentGovernanceGrantRepositoryPort,
	DocumentGovernanceGrantType,
};
