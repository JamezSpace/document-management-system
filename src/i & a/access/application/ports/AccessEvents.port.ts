import type Role from "../../domain/role/Role.js";

interface AccessEventsPort {
	officialRoleAssigned(payload: {
		staffId: string;
		role: Role;
	}): Promise<void>;

	roleDelegated(payload: {
		staffId: string;
		role: Role;
		delegatedBy: string;
		validTo: Date;
	}): Promise<void>;

	roleRevoked(payload: {
		staffId: string;
		role: Role;
        revokedBy: string;
	}): Promise<void>;

	roleCreated(payload: {
		roleId: string
	}): Promise<void>;
}

export type { AccessEventsPort };

