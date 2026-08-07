import type Role from "../../domain/role/Role.js";
import RoleAssignment, {
	RoleAssignmentSource,
} from "../../domain/RoleAssignment.js";
import type { AccessEventsPort } from "../ports/AccessEvents.port.js";
import type { RoleAssignmentRepositoryPort } from "../ports/RoleAssignmentsRepository.port.js";

class DelegateRole {
	private readonly authorityEvents: AccessEventsPort;
	private readonly roleAssignmentRepo: RoleAssignmentRepositoryPort;

	constructor(
		authorityEvents: AccessEventsPort,
		accessRepo: RoleAssignmentRepositoryPort,
	) {
		this.authorityEvents = authorityEvents;
		this.roleAssignmentRepo = accessRepo;
	}

	async delegateRole(payload: {
		staffId: string;
		role: Role;
		delegatedBy: string;
		validTo: Date;
	}) {
		const { staffId, role, delegatedBy, validTo } = payload;

		// create RoleAssignment (domain enforces invariants)
		const assignment = new RoleAssignment({
			identityId: staffId,
			role,
			validFrom: new Date(),
			delegatedBy,
			source: RoleAssignmentSource.MANUAL,
			validTo,
		});

		// persist
		const roleDelegated = await this.roleAssignmentRepo.save(assignment);

		// emit event
        if(roleDelegated)
            await this.authorityEvents.roleDelegated({
                staffId: staffId,
                role: role,
                delegatedBy,
                validTo,
            });
	}
}

export default DelegateRole;
