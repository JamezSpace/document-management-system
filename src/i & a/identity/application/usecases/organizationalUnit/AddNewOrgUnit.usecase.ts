import type { IdGeneratorPort } from "../../../../../shared/application/port/services/IdGenerator.port.js";
import OrganizationalUnit from "../../../domain/entities/unit/OrganizationalUnit.js";

import type { OrgUnitEventsPort } from "../../ports/events/unit/OrgUnitEvents.port.js";
import type { OrgUnitRepositoryPort } from "../../ports/repos/entities/unit/OrgUnitRepository.port.js";
import type { OrganizationalUnitTypeForCreation } from "../../types/unit/orgUnit.type.js";


class AddNewOrgUnitUseCase {
	constructor(
        private readonly idGenerator: IdGeneratorPort,
		private readonly unitEvents: OrgUnitEventsPort,
		private readonly unitRepo: OrgUnitRepositoryPort,
	) {}

    async addNewOrgUnit(payload: OrganizationalUnitTypeForCreation) {
        const uuid = this.idGenerator.generate();
        const orgUnitId = 'UNIT-' + uuid

        const newOrgUnit = new OrganizationalUnit({
            id: orgUnitId,
            code: payload.code ?? null,
            fullName: payload.fullName,
            description: payload.description,
            parentId: payload.parentId ?? null,
            sector: payload.sector
        });

        const newlySavedUnit = await this.unitRepo.save(newOrgUnit)

        if(newlySavedUnit)
            await this.unitEvents.unitCreated({
                unitId: newlySavedUnit.id
            })

        return newlySavedUnit;
    }
}

export default AddNewOrgUnitUseCase;