import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type Role from "../../../access/domain/role/Role.js";
import type { RoleRepositoryPort } from "../../../access/application/ports/RolesRepository.port.js";
import type { CapabilityRoleRepositoryPort } from "../../application/ports/repos/mappings/CapRoleRepository.port.js";
import type { RoleServicePort } from "../../application/ports/services/RoleService.port.js";

class RoleServiceAdapter implements RoleServicePort {
	constructor(
		private readonly capabilityRoleRepo: CapabilityRoleRepositoryPort,
		private readonly roleRepo: RoleRepositoryPort,
	) {}

	async getRolesFromCapability(capabilityClassId: string, tx?: TransactionContext): Promise<Role[]> {
		return this.capabilityRoleRepo.findRolesByCapabilityClassId(
			capabilityClassId,
            tx
		);
	}

	async getRoleByName(name: string): Promise<Role | null> {
		return this.roleRepo.findByName(name);
	}
}

export default RoleServiceAdapter;
