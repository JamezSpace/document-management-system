import type { TransactionContext } from "../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type StaffCapabilityClass from "../../../domain/entities/staff/StaffCapabilityClass.js";

interface ClassificationServicePort {
	getDefaultCapabilityClassFromDesignation(
		designationId: string,
        tx?: TransactionContext
	): Promise<StaffCapabilityClass | null>;
}

export type { ClassificationServicePort };
