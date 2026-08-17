import type { TransactionContext } from "../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type Role from "../../../../../access/domain/role/Role.js";

interface CapabilityRoleRepositoryPort {
	findRolesByCapabilityClassId(
		capabilityClassId: string,
		tx?: TransactionContext,
	): Promise<Role[]>;
}

export type { CapabilityRoleRepositoryPort };
