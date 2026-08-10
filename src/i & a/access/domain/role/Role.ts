import type Permission from "../permission/Permission.js";

/**
 * This class "Role" represents an institutional authority construct.
 * It is just simply a  bundle of permissions, nothing more.
 *
 * E.g Director = [Permission.CAN_APPROVE_DOCUMENTS, Permission.CAN_REJECT_DOCUMENTS]
 */
class Role {
  constructor(
    private readonly id: string,
    readonly name: string,
    private readonly permissions: Set<Permission>
  ) {}

  getId(): string {
    return this.id;
  }

  getPermissions(): Permission[] {
    return Array.from(this.permissions);
  }

  hasPermission(permission: Permission): boolean {
	return Array.from(this.permissions).some(
		(existing) => existing.getCode() === permission.getCode(),
	);
  }
}


export default Role;
