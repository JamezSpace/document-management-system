import type { AuthorizationScope } from "../../../../security/application/type/authorization.type.js";
import type RoleAssignment from "../../domain/RoleAssignment.js";
import type { RoleAssignmentSource } from "../../domain/RoleAssignment.js";
import type { RoleAssignmentRepositoryPort } from "../ports/RoleAssignmentsRepository.port.js";

interface EffectiveRoleAssignmentDTO {
	assignmentId: string;
	role: string;
	scope: AuthorizationScope;
	source: RoleAssignmentSource;
	validFrom: string;
	validTo: string | null;
	assignedBy: string;
	delegatedBy: string | null;
}

interface StaffAuthorityDTO {
	roles: string[];
	capabilities: string[];
	roleAssignments: EffectiveRoleAssignmentDTO[];
	capabilityScopes: Record<string, AuthorizationScope[]>;
}

class ResolveStaffAuthorityUseCase {
	constructor(
		private readonly roleAssignmentRepo: RoleAssignmentRepositoryPort,
	) {}

	async execute(
		staffId: string,
		at: Date = new Date(),
	): Promise<StaffAuthorityDTO> {
		const assignments =
			await this.roleAssignmentRepo.findEffectiveByStaffId(staffId, at);
		const roles = new Set<string>();
		const capabilities = new Set<string>();
		const scopesByCapability = new Map<
			string,
			Map<string, AuthorizationScope>
		>();

		for (const assignment of assignments) {
			roles.add(assignment.role.name);

			for (const permission of assignment.role.getPermissions()) {
				const capability = permission.getCode();
				capabilities.add(capability);

				let scopes = scopesByCapability.get(capability);
				if (!scopes) {
					scopes = new Map();
					scopesByCapability.set(capability, scopes);
				}
				scopes.set(scopeKey(assignment.scope), assignment.scope);
			}
		}

		const roleAssignments = assignments
			.map(toAssignmentDTO)
			.sort((left, right) =>
				left.role.localeCompare(right.role) ||
				left.assignmentId.localeCompare(right.assignmentId),
			);
		const capabilityScopes = Object.fromEntries(
			Array.from(scopesByCapability.entries())
				.sort(([left], [right]) => left.localeCompare(right))
				.map(([capability, scopes]) => [
					capability,
					Array.from(scopes.values()).sort(compareScopes),
				]),
		);

		return {
			roles: Array.from(roles).sort(),
			capabilities: Array.from(capabilities).sort(),
			roleAssignments,
			capabilityScopes,
		};
	}
}

function toAssignmentDTO(
	assignment: RoleAssignment,
): EffectiveRoleAssignmentDTO {
	return {
		assignmentId: assignment.id,
		role: assignment.role.name,
		scope: assignment.scope,
		source: assignment.source,
		validFrom: assignment.validFrom.toISOString(),
		validTo: assignment.getValidTo()?.toISOString() ?? null,
		assignedBy: assignment.assignedBy,
		delegatedBy: assignment.delegatedBy,
	};
}

function scopeKey(scope: AuthorizationScope): string {
	return `${scope.type}:${scope.id ?? ""}`;
}

function compareScopes(
	left: AuthorizationScope,
	right: AuthorizationScope,
): number {
	return scopeKey(left).localeCompare(scopeKey(right));
}

export default ResolveStaffAuthorityUseCase;
export type { EffectiveRoleAssignmentDTO, StaffAuthorityDTO };
