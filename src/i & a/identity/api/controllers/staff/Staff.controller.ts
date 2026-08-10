import type ResolveStaffAuthorityUseCase from "../../../../access/application/usecases/ResolveStaffAuthority.usecase.js";
import type ActivationOrchestratorUseCase from "../../../application/usecases/staff/activateStaff/ActivationOrchestrator.usecase.js";
import type AddNewStaffUseCase from "../../../application/usecases/staff/AddNewStaff.usecase.js";
import type CreateStaffViaInviteUseCase from "../../../application/usecases/staff/CreateStaffViaInvite.usecase.js";
import type DeleteStaffUseCase from "../../../application/usecases/staff/DeleteStaff.usecase.js";
import type EditExistingStaffUseCase from "../../../application/usecases/staff/EditExistingStaff.usecase.js";
import type FetchStaffRecordUsecase from "../../../application/usecases/staff/FetchStaffRecord.usecase.js";
import type GetAllStaffUseCase from "../../../application/usecases/staff/GetAllStaff.usecase.js";
import type Staff from "../../../domain/entities/staff/Staff.js";
import type {
    CreateStaffType
} from "../../types/staff/staff.type.js";

class StaffController {
	constructor(
		private readonly getAllStaffUseCase: GetAllStaffUseCase,
		private readonly addNewStaffUseCase: AddNewStaffUseCase,
		private readonly createStaffViaInviteUseCase: CreateStaffViaInviteUseCase,
		private readonly staffActivationUseCase: ActivationOrchestratorUseCase,
		private readonly editExistingStaffUseCase: EditExistingStaffUseCase,
		private readonly deleteStaffUseCase: DeleteStaffUseCase,
		private readonly fetchStaffUseCase: FetchStaffRecordUsecase,
		private readonly resolveStaffAuthorityUseCase: ResolveStaffAuthorityUseCase,
	) {}

	// manual disjointed approach (not for frontend). Use registerNewStaff instead
	async addNewStaff(payload: CreateStaffType) {
		const { activatedAt, ...payloadWithoutDate } = payload;

		const newStaff = await this.addNewStaffUseCase.execute({
			activatedAt: new Date(activatedAt),
			...payloadWithoutDate,
		});

		return newStaff;
	}

	async createStaffViaInvite(inviteId: string, activatorId: string) {
		const result = await this.createStaffViaInviteUseCase.execute(
			inviteId,
			activatorId,
		);

		return result;
	}

	async activateStaff(staffId: string, inviteId: string) {
		const activatedStaff = await this.staffActivationUseCase.execute(
			staffId, inviteId
		);

		return activatedStaff
	}

	async updateExistingStaff(staffId: string, newStaff: Partial<Staff>) {
		const editedStaff = this.editExistingStaffUseCase.editExistingStaff(
			staffId,
			newStaff,
		);

		return editedStaff;
	}

	async fetchExistingStaff(staffId: string) {
		const staff = this.fetchStaffUseCase.fetchStaff(staffId);

		return staff;
	}

	async fetchExistingStaffByAuthProviderId(authProviderId: string) {
		const staff = this.fetchStaffUseCase.fetchStaffByAuthProviderId(authProviderId);

		return staff;
	}

	async deleteExistingStaff(staffId: string) {
		await this.deleteStaffUseCase.deleteStaff(staffId);
	}

	async fetchAllNonDeletedStaffMembersByUnit(unitId: string) {
		const allStaffMembers =
			this.getAllStaffUseCase.getAllNonDeletedStaffMembersByUnit(unitId);

		return allStaffMembers;
	}

    async fetchAllNonDeletedStaff() {
        const allStaffMembers =
			this.getAllStaffUseCase.getAllNonDeletedStaff();

		return allStaffMembers;
    }

	async fetchStaffWithMediaForLogin(staffId: string) {
		const me = this.fetchStaffUseCase.fetchStaffWithMedia(staffId);

		return me;
	}

	async fetchStaffWithAuthority(staffId: string) {
		const staff = await this.fetchStaffWithMediaForLogin(staffId);

		if (!staff) return null;

		const authority = await this.resolveStaffAuthorityUseCase.execute(
			staff.getStaffId(),
		);

		return {
			staff: {
				id: staff.getStaffId(),
				identityId: staff.identityId,
				firstName: staff.firstName,
				middleName: staff.middleName,
				lastName: staff.lastName,
				fullName: staff.fullName,
				email: staff.email,
				staffNumber: staff.staffNumber,
				employmentType: staff.employmentType,
				status: staff.status,
				unit: staff.unit,
				office: staff.office,
				designation: staff.designation,
				media: staff.media,
				createdAt: staff.createdAt,
				updatedAt: staff.updatedAt ?? null,
			},
			authority,
		};
	}
}

export default StaffController;
