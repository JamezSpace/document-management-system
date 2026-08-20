import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";

interface CustodyHandoverRecord {
	documentId: string;
	previousStaffId: string;
	replacementStaffId: string | null;
	state: "reassigned" | "in_handover";
	policyId: string;
	policyVersion: number;
}

interface TransferredCustodyRepositoryPort {
	handover(staffId: string, tx: TransactionContext): Promise<CustodyHandoverRecord[]>;
	claimForIncomingStaff(staffId: string, tx: TransactionContext): Promise<CustodyHandoverRecord[]>;
}

export type { CustodyHandoverRecord, TransferredCustodyRepositoryPort };
