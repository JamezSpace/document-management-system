import type { AuthorizationScope } from "../../../../security/application/authorization.types.js";
import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type Role from "../../domain/role/Role.js";
import RoleAssignment, {
	RoleAssignmentSource,
} from "../../domain/RoleAssignment.js";
import type { AccessEventsPort } from "../ports/AccessEvents.port.js";
import type { RoleAssignmentRepositoryPort } from "../ports/RoleAssignmentsRepository.port.js";

class AssignOfficialRoleUseCase {
	constructor(
		private readonly authorityEvents: AccessEventsPort,
		private readonly roleAssignmentRepo: RoleAssignmentRepositoryPort,
		private readonly idGenerator: IdGeneratorPort,
	) {}

	async execute(
		payload: {
			staffId: string;
			role: Role;
			scope?: AuthorizationScope;
			assignedBy?: string;
			validFrom?: Date;
			validTo?: Date | null;
		},
		tx?: TransactionContext,
	): Promise<RoleAssignment> {
		const scope = payload.scope ?? { type: "organization", id: null };
		const validFrom = payload.validFrom ?? new Date();
		const assignments = await this.roleAssignmentRepo.findByStaffId(
			payload.staffId,
			tx,
		);
		const existing = assignments.find(
			(assignment) =>
				assignment.role.getId() === payload.role.getId() &&
				assignment.isActive(validFrom) &&
				scopesEqual(assignment.scope, scope),
		);

		if (existing) return existing;

		const assignment = new RoleAssignment({
			id: `ROLE-ASSIGN-${this.idGenerator.generate()}`,
			staffId: payload.staffId,
			role: payload.role,
			scope,
			source: RoleAssignmentSource.DERIVED,
			validFrom,
			validTo: payload.validTo ?? null,
			assignedBy: payload.assignedBy ?? "staff.system",
		});

		await this.roleAssignmentRepo.insert(assignment, tx);
		await this.authorityEvents.officialRoleAssigned({
			staffId: payload.staffId,
			role: payload.role,
		});

		return assignment;
	}
}

function scopesEqual(
	left: AuthorizationScope,
	right: AuthorizationScope,
): boolean {
	return left.type === right.type && left.id === right.id;
}

export default AssignOfficialRoleUseCase;
