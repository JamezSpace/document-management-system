import type { TransactionContext } from "../../../../../../../shared/infrastructure/persistence/primary/postgres.js";

interface SaveStaffMediaPayload {
	staffId: string;
	mediaId: string;
	assetRole: string;
	isActive?: boolean;
	assignedAt?: Date;
}

interface StaffMediaRepositoryPort {
	save(payload: SaveStaffMediaPayload, tx?: TransactionContext): Promise<void>;

	deactivateByRole(staffId: string, assetRole: string): Promise<void>;
}

export type { SaveStaffMediaPayload, StaffMediaRepositoryPort };
