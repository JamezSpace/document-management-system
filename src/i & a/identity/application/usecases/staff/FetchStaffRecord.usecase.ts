import type { StaffRepositoryPort } from "../../ports/repos/entities/staff/StaffRepository.port.js";

class FetchStaffRecordUsecase {
	constructor(private readonly staffRepo: StaffRepositoryPort) {}

	async fetchStaff(staffId: string) {
		const staff = await this.staffRepo.findStaffWithoutMediaById(staffId);

		return staff;
	}

	async fetchStaffWithMedia(staffId: string) {
		const staffDetails = await this.staffRepo.findStaffWithMediaByStaffId(staffId);

		return staffDetails;
	}

    async fetchStaffByAuthProviderId(authProviderId: string) {
        const staff = await this.staffRepo.findStaffByAuthProviderId(authProviderId);

        return staff;
    }
}

export default FetchStaffRecordUsecase;
