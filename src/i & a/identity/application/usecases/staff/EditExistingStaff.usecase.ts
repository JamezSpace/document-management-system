import type Staff from "../../../domain/entities/staff/Staff.js";
import type { StaffEventsPort } from "../../ports/events/staff/StaffEvent.port.js";
import type { StaffRepositoryPort } from "../../ports/repos/entities/staff/StaffRepository.port.js";

class EditExistingStaffUseCase {
    constructor(
		private readonly staffEvents: StaffEventsPort,
		private readonly staffRepo: StaffRepositoryPort,
	) {}

    async editExistingStaff(staffId: string, staffUpdate: Partial<Staff>): Promise<Staff | null> {
        const editedStaff = await this.staffRepo.updateStaff({
			staffId,
			changesToMake: staffUpdate,
		})
		if (editedStaff) {
			await this.staffEvents.staffUpdated({ staffId });
			if (staffUpdate.unitId !== undefined || staffUpdate.designationId !== undefined) {
				await this.staffEvents.staffPositionChanged({ staffId });
			}
		}
        return editedStaff;
    }
}

export default EditExistingStaffUseCase;
