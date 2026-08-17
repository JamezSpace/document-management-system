import type OrganizationalUnit from "../../../../../domain/entities/unit/OrganizationalUnit.js";

interface OrgUnitRepositoryPort {
	save(orgUnit: OrganizationalUnit): Promise<OrganizationalUnit>;

	findOrgUnitById(id: string): Promise<OrganizationalUnit | null>;

	findAllUnitsBySector(sector: string): Promise<OrganizationalUnit[]>;

	fetchAllUnits(): Promise<OrganizationalUnit[]>;
}

export type { OrgUnitRepositoryPort };

