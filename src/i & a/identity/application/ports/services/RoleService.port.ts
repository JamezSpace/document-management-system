import type { TransactionContext } from "../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type Role from "../../../../access/domain/role/Role.js";

interface RoleServicePort {
    getRolesFromCapability(
        capabilityClassId: string,
        tx?: TransactionContext,
    ): Promise<Role[]>;

    getRoleByName(name: string): Promise<Role | null>;
}

export type {RoleServicePort};
