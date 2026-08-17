import type { IdGeneratorPort } from "../../../../../shared/application/port/services/IdGenerator.port.js";
import Designation from "../../../domain/entities/office/Designation.js";
import type { DesignationEventsPort } from "../../ports/events/office/DesignationEvents.port.js";
import type { DesignationRepositoryPort } from "../../ports/repos/entities/designation/DesignationRepository.port.js";
import type { DesignationTypeForCreation } from "../../types/office/designation.type.js";

class AddNewDesignationUseCase {
    constructor(
            private readonly idGenerator: IdGeneratorPort,
            private readonly designationEvents: DesignationEventsPort,
            private readonly designationRepo: DesignationRepositoryPort,
        ) {}

    async execute(payload: DesignationTypeForCreation) {
        const uuid = this.idGenerator.generate();
		const designationId = "DESIG-" + uuid;

        // create an office designation
        const designation = payload.description ? new Designation({
            id: designationId,
            description: payload.description,
            officeId: payload.officeId,
            title: payload.title
        }) : new Designation({
            id: designationId,
            officeId: payload.officeId,
            title: payload.title
        });

		const newDesignation = await this.designationRepo.save(designation)        

		if (newDesignation)
			await this.designationEvents.officeDesignationCreated({
				designationId: newDesignation.getDesignationId(),
			});

		return newDesignation;
    }
}

export default AddNewDesignationUseCase;