import type { AuthorizationScope } from "../../../../security/application/authorization.types.js";
import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import { AccessDomainErrors } from "../../../../shared/errors/enum/domain.enum.js";
import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import AccessDomainError from "../../domain/errors/AccessDomainError.js";
import RoleAssignment, {
	RoleAssignmentSource,
} from "../../domain/RoleAssignment.js";
import type { AccessEventsPort } from "../ports/AccessEvents.port.js";
import type { RoleAssignmentRepositoryPort } from "../ports/RoleAssignmentsRepository.port.js";
import type { RoleRepositoryPort } from "../ports/RolesRepository.port.js";

class AssignRoleUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly roleRepository: RoleRepositoryPort,
		private readonly assignmentRepository: RoleAssignmentRepositoryPort,
		private readonly accessEvents: AccessEventsPort,
	) {}

	async execute(
		payload: {
			staffId: string;
			roleId: string;
			scope: AuthorizationScope;
			validFrom?: Date;
			validTo?: Date | null;
			assignedBy: string;
		},
		tx?: TransactionContext,
	): Promise<RoleAssignment> {
		const role = await this.roleRepository.findById(payload.roleId);
		if (!role) {
			throw new AccessDomainError(AccessDomainErrors.UNKNOWN_ROLE);
		}

		const assignment = new RoleAssignment({
			id: `ROLE-ASSIGN-${this.idGenerator.generate()}`,
			staffId: payload.staffId,
			role,
			scope: payload.scope,
			source: RoleAssignmentSource.MANUAL,
			validFrom: payload.validFrom ?? new Date(),
			validTo: payload.validTo ?? null,
			assignedBy: payload.assignedBy,
		});

		await this.assignmentRepository.insert(assignment, tx);
		await this.accessEvents.officialRoleAssigned({
			staffId: assignment.staffId,
			role: assignment.role,
		});

		return assignment;
	}
}

export default AssignRoleUseCase;
