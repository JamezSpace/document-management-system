import type Permission from "./permission/Permission.js";
import type RoleAssignment from "./RoleAssignment.js";

interface PermissionResolverDTO {
	identityId: string;
	permission: Permission;
	rolesAssigned: RoleAssignment[];
}

class PermissionResolver {
	readonly staffId: string;
	readonly rolesAssigned: RoleAssignment[];
	readonly permission: Permission;

	constructor(resolverDTO: PermissionResolverDTO) {
		this.staffId = resolverDTO.identityId;
		this.permission = resolverDTO.permission;
		this.rolesAssigned = resolverDTO.rolesAssigned;
	}

	identityHasPermission(): boolean {
		return this.rolesAssigned
			.filter((r) => r.isActive())
			.some((r) => r.role.hasPermission(this.permission));
	}
}

export default PermissionResolver;
