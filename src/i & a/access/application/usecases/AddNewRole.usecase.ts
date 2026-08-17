import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import Role from "../../domain/role/Role.js";
import type { AccessEventsPort } from "../ports/AccessEvents.port.js";
import type { RoleRepositoryPort } from "../ports/RolesRepository.port.js";

class AddNewRoleUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly authorityEvents: AccessEventsPort,
		private readonly roleRepo: RoleRepositoryPort,
	) {}

	async addNewRole(payload: { name: string }) {
		const uuid = this.idGenerator.generate();
		const roleId = "ROLE-" + uuid;

		// role permissions can be attached separately from role creation
		const role = new Role(roleId, payload.name, new Set());

		await this.roleRepo.save(role);

		await this.authorityEvents.roleCreated({
			roleId: role.getId(),
		});

		return role;
	}

}

export default AddNewRoleUseCase;
