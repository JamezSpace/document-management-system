import { AccessDomainErrors } from "../../../shared/errors/enum/domain.enum.js";
import type { AuthorizationScope } from "../../../security/application/type/authorization.type.js";
import AccessDomainError from "./errors/AccessDomainError.js";
import type Role from "./role/Role.js";

enum RoleAssignmentSource {
	MANUAL = "manual",
	DERIVED = "derived",
	DELEGATED = "delegated",
}

interface RoleAssignmentDTO {
	id: string;
	staffId: string;
	role: Role;
	scope: AuthorizationScope;
	source: RoleAssignmentSource;
	validFrom: Date;
	validTo?: Date | null;
	assignedBy: string;
	delegatedBy?: string | null;
	revokedBy?: string | null;
	revokedAt?: Date | null;
	createdAt?: Date;
}

class RoleAssignment {
	readonly id: string;
	readonly staffId: string;
	readonly role: Role;
	readonly scope: AuthorizationScope;
	readonly source: RoleAssignmentSource;
	readonly assignedBy: string;
	readonly delegatedBy: string | null;
	private readonly _validFrom: Date;
	private readonly _createdAt: Date;
	private validTo: Date | null;
	private revokedBy: string | null;
	private revokedAt: Date | null;

	constructor(dto: RoleAssignmentDTO) {
		this.validateScope(dto.scope);

		const validFrom = new Date(dto.validFrom);
		const validTo = dto.validTo ? new Date(dto.validTo) : null;
		const revokedAt = dto.revokedAt ? new Date(dto.revokedAt) : null;

		if (validTo && validTo <= validFrom) {
			throw new AccessDomainError(
				AccessDomainErrors.INVALID_ROLE_ASSIGNMENT_VALIDITY,
				"Role assignment validTo must be later than validFrom",
			);
		}

		if (dto.source === RoleAssignmentSource.DELEGATED) {
			if (!dto.delegatedBy || !validTo) {
				throw new AccessDomainError(
					AccessDomainErrors.DELEGATED_ROLE_MISSING_EXPIRY,
				);
			}
		} else if (dto.delegatedBy) {
			throw new AccessDomainError(
				AccessDomainErrors.INVALID_ROLE_ASSIGNMENT_PROVENANCE,
				"Only delegated assignments may identify a delegator",
			);
		}

		if ((revokedAt === null) !== ((dto.revokedBy ?? null) === null)) {
			throw new AccessDomainError(
				AccessDomainErrors.INVALID_ROLE_ASSIGNMENT_PROVENANCE,
				"revokedAt and revokedBy must be provided together",
			);
		}

		if (revokedAt && revokedAt < validFrom) {
			throw new AccessDomainError(
				AccessDomainErrors.INVALID_ROLE_REVOCATION_DATE,
			);
		}

		this.id = dto.id;
		this.staffId = dto.staffId;
		this.role = dto.role;
		this.scope = Object.freeze({ ...dto.scope });
		this.source = dto.source;
		this.assignedBy = dto.assignedBy;
		this.delegatedBy = dto.delegatedBy ?? null;
		this._validFrom = validFrom;
		this.validTo = validTo;
		this.revokedBy = dto.revokedBy ?? null;
		this.revokedAt = revokedAt;
		this._createdAt = dto.createdAt ? new Date(dto.createdAt) : new Date();
	}

	get validFrom(): Date {
		return new Date(this._validFrom);
	}

	get createdAt(): Date {
		return new Date(this._createdAt);
	}

	isActive(at: Date = new Date()): boolean {
		const instant = at.getTime();
		if (instant < this._validFrom.getTime()) return false;
		if (this.validTo && instant >= this.validTo.getTime()) return false;
		if (this.revokedAt && instant >= this.revokedAt.getTime()) return false;
		return true;
	}

	revoke(actorId: string, at: Date = new Date()): void {
		const revokedAt = new Date(at);
		if (revokedAt < this._validFrom) {
			throw new AccessDomainError(
				AccessDomainErrors.INVALID_ROLE_REVOCATION_DATE,
			);
		}

		if (this.revokedAt || (this.validTo && revokedAt >= this.validTo)) {
			throw new AccessDomainError(AccessDomainErrors.ROLE_ALREADY_CLOSED);
		}

		this.validTo = new Date(revokedAt);
		this.revokedAt = new Date(revokedAt);
		this.revokedBy = actorId;
	}

	getValidTo(): Date | null {
		return this.validTo ? new Date(this.validTo) : null;
	}

	getRevokedAt(): Date | null {
		return this.revokedAt ? new Date(this.revokedAt) : null;
	}

	getRevokedBy(): string | null {
		return this.revokedBy;
	}

	private validateScope(scope: AuthorizationScope): void {
		if (scope.type === "organization" && scope.id === null) return;
		if (
			(scope.type === "unit" || scope.type === "office") &&
			typeof scope.id === "string" &&
			scope.id.trim().length > 0
		) {
			return;
		}

		throw new AccessDomainError(
			AccessDomainErrors.INVALID_ROLE_ASSIGNMENT_SCOPE,
		);
	}
}

export default RoleAssignment;
export { RoleAssignmentSource, type RoleAssignmentDTO };
