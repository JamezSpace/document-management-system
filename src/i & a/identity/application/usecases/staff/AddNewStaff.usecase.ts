import type { IdGeneratorPort } from "../../../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionContext } from "../../../../../shared/infrastructure/persistence/primary/postgres.js";
import Staff from "../../../domain/entities/staff/Staff.js";
import type { StaffEventsPort } from "../../ports/events/staff/StaffEvent.port.js";
import type { StaffRepositoryPort } from "../../ports/repos/entities/staff/StaffRepository.port.js";
import type { StaffTypeForCreation } from "../../types/staff/staff.type.js";

class AddNewStaffUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly staffEvents: StaffEventsPort,
		private readonly staffRepo: StaffRepositoryPort,
	) {}

	async execute(payload: StaffTypeForCreation, transactionInstance?: TransactionContext) {
		const uuid = this.idGenerator.generate();
		const staffId = "STAFF-" + uuid;

		// create a new staff
		const staff = new Staff({ 
            id: staffId, 
            ...payload
        });

		const newStaff = await this.staffRepo.save(staff, transactionInstance);

		if (newStaff)
			await this.staffEvents.staffAdded({
				staffId: newStaff.getStaffId(),
			});

		return newStaff;
	}
}

export default AddNewStaffUseCase;
