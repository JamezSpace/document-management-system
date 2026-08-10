import type { AuthorizationScope } from "../../../../security/application/authorization.types.js";
import type AssignRoleUseCase from "../../application/usecases/AssignRole.usecase.js";
import type DelegateRole from "../../application/usecases/DelegateRole.usecase.js";
import type ListRoleAssignmentsUseCase from "../../application/usecases/ListRoleAssignments.usecase.js";
import type RevokeRole from "../../application/usecases/RevokeRole.js";
import type RoleAssignment from "../../domain/RoleAssignment.js";

interface AssignRoleInput {
	staffId: string;
	roleId: string;
	scope: AuthorizationScope;
	validFrom?: string;
	validTo?: string | null;
}

interface DelegateRoleInput {
	staffId: string;
	validFrom?: string;
	validTo: string;
}

class RoleAssignmentController {
	constructor(
		private readonly assignRoleUseCase: AssignRoleUseCase,
		private readonly delegateRoleUseCase: DelegateRole,
		private readonly revokeRoleUseCase: RevokeRole,
		private readonly listRoleAssignmentsUseCase: ListRoleAssignmentsUseCase,
	) {}

	async assign(payload: AssignRoleInput, actorId: string) {
		const assignment = await this.assignRoleUseCase.execute({
			staffId: payload.staffId,
			roleId: payload.roleId,
			scope: payload.scope,
			assignedBy: actorId,
			...(payload.validFrom
				? { validFrom: new Date(payload.validFrom) }
				: {}),
			...(payload.validTo !== undefined
				? {
						validTo: payload.validTo
							? new Date(payload.validTo)
							: null,
					}
				: {}),
		});

		return toRoleAssignmentDTO(assignment);
	}

	async delegate(
		sourceAssignmentId: string,
		payload: DelegateRoleInput,
		actorId: string,
	) {
		const assignment = await this.delegateRoleUseCase.delegateRole({
			sourceAssignmentId,
			staffId: payload.staffId,
			delegatedBy: actorId,
			validTo: new Date(payload.validTo),
			...(payload.validFrom
				? { validFrom: new Date(payload.validFrom) }
				: {}),
		});

		return toRoleAssignmentDTO(assignment);
	}

	async revoke(assignmentId: string, actorId: string) {
		const assignment = await this.revokeRoleUseCase.revokeRole({
			assignmentId,
			revokedBy: actorId,
		});

		return toRoleAssignmentDTO(assignment);
	}

	async listForStaff(staffId: string) {
		const assignments = await this.listRoleAssignmentsUseCase.execute(staffId);
		return assignments.map(toRoleAssignmentDTO);
	}
}

function toRoleAssignmentDTO(assignment: RoleAssignment) {
	return {
		assignmentId: assignment.id,
		staffId: assignment.staffId,
		role: {
			id: assignment.role.getId(),
			name: assignment.role.name,
		},
		scope: assignment.scope,
		source: assignment.source,
		validFrom: assignment.validFrom.toISOString(),
		validTo: assignment.getValidTo()?.toISOString() ?? null,
		assignedBy: assignment.assignedBy,
		delegatedBy: assignment.delegatedBy,
		revokedBy: assignment.getRevokedBy(),
		revokedAt: assignment.getRevokedAt()?.toISOString() ?? null,
		createdAt: assignment.createdAt.toISOString(),
	};
}

export default RoleAssignmentController;
export { toRoleAssignmentDTO };
