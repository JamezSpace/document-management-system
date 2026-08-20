import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";

interface DocumentSignatureRepositoryPort {
	recordUnitHeadSignature(
		payload: {
			id: string;
			documentId: string;
			signedBy: string;
			signedAt: Date;
		},
		tx?: TransactionContext,
	): Promise<void>;
}

export type { DocumentSignatureRepositoryPort };
