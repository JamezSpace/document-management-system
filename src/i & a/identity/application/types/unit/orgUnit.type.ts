import type { OrganizationalUnitSector } from "../../../domain/enum/orgUnitSector.enum.js";

interface OrganizationalUnitTypeForCreation {
	code?: string;
	fullName: string;
	description: string;
	sector: OrganizationalUnitSector;
	parentId?: string;
}

export type { OrganizationalUnitTypeForCreation };

