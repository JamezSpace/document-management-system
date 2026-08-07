import type { OrganizationalUnitSector } from "../../enum/orgUnitSector.enum.js";

interface OrganizationUnitPayload {
	id: string;
	code: string | null;
	fullName: string;
	description: string;
	sector: OrganizationalUnitSector;
	parentId: string | null;
    createdAt?: Date
    updatedAt?: Date
}

/**
 * Example: OrgUnit {
 *  sector: 'non-academic',
 *  unit: 'items',
 *  subunits: ['mis', 'software dev']
 * }
 */
class OrganizationalUnit {
	readonly id: string;
	readonly code: string | null;
	readonly fullName: string;
	readonly description: string;
	readonly sector: OrganizationalUnitSector;
	readonly parentId: string | null;
	readonly createdAt: Date;
	readonly updatedAt: Date;

	constructor(payload: OrganizationUnitPayload) {
		this.id = payload.id;
		this.code = payload.code;
		this.fullName = payload.fullName;
		this.description = payload.description;
		this.sector = payload.sector;
		this.parentId = payload.parentId;
        
        this.createdAt = payload.createdAt ?? new Date();
		this.updatedAt = payload.updatedAt ?? this.createdAt;
	}

	isRoot(): boolean {
		return this.parentId === null;
	}
}

export default OrganizationalUnit;
