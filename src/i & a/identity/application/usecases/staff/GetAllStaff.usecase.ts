import type { StaffRepositoryPort } from "../../ports/repos/entities/staff/StaffRepository.port.js";

class GetAllStaffUseCase {
	constructor(
		private readonly staffRepo: StaffRepositoryPort,
	) {}

    async getAllNonDeletedStaffMembersByUnit(unitId: string) {
        const staffMembers = await this.staffRepo.fetchAllStaffMembersByUnit(unitId)

        return staffMembers;
    }

    async getAllNonDeletedStaff() {
        const staff = await this.staffRepo.fetchAllStaffWithMedia()

        return staff;
    }
}

export default GetAllStaffUseCase;
