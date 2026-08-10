import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type RoleAssignment from "../../domain/RoleAssignment.js";

interface RoleAssignmentRepositoryPort {
	insert(
		roleAssignment: RoleAssignment,
		tx?: TransactionContext,
	): Promise<RoleAssignment>;

	findById(
		assignmentId: string,
		tx?: TransactionContext,
		options?: { forUpdate?: boolean },
	): Promise<RoleAssignment | null>;

	findByStaffId(
		staffId: string,
		tx?: TransactionContext,
	): Promise<RoleAssignment[]>;

	findEffectiveByStaffId(
		staffId: string,
		at: Date,
		tx?: TransactionContext,
	): Promise<RoleAssignment[]>;

	revoke(
		roleAssignment: RoleAssignment,
		tx?: TransactionContext,
	): Promise<void>;
}

export type { RoleAssignmentRepositoryPort };
