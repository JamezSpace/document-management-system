import type { IdGeneratorPort } from "../../../../../../shared/application/port/services/IdGenerator.port.js";
import StaffClassification from "../../../../domain/entities/staff/StaffClassification.js";
import type { StaffClassificationEventsPort } from "../../../ports/events/staff/StaffclassificationEvents.port.js";
import type { StaffClassificationRepositoryPort } from "../../../ports/repos/entities/staff/StaffClassificationRepository.port.js";
import type { StaffClassTypeForCreation } from "../../../types/staff/staffClass.type.js";

class CreateStaffClassificationUseCase {
    constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly staffClassEvents: StaffClassificationEventsPort,
		private readonly staffClassRepo: StaffClassificationRepositoryPort,
	) {}

    async createNewStaffClassification(payload: StaffClassTypeForCreation) {
        const uuid = this.idGenerator.generate();
		const classId = "STAFF-CLASS-" + uuid;

        // create a new staff classification
		const staffClassification = new StaffClassification({ id: classId, ...payload });

        const newStaffClassification = await this.staffClassRepo.save(staffClassification);

		if (newStaffClassification)
			await this.staffClassEvents.staffClassificationCreated({
				classificationId: classId
			});

        return newStaffClassification;
    }
}

export default CreateStaffClassificationUseCase;