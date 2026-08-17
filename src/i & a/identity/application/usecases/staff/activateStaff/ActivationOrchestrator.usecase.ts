import type { IdGeneratorPort } from "../../../../../../shared/application/port/services/IdGenerator.port.js";
import type { StaffEventsPort } from "../../../ports/events/staff/StaffEvent.port.js";
import type { ActivationFailureRepositoryPort } from "../../../ports/repos/entities/staff/StaffActivationFailureRepository.port.js";
import type ActivateStaffUseCase from "./ActivateStaff.usecase.js";

class ActivationOrchestratorUseCase {
	constructor(
		private readonly activateStaff: ActivateStaffUseCase,
		private readonly activationFailureRepo: ActivationFailureRepositoryPort,
		private readonly staffEvents: StaffEventsPort,
		private readonly idGenerator: IdGeneratorPort,
	) {}

	async execute(staffId: string, inviteId: string) {
		try {
			const activatedStaff = await this.activateStaff.execute(
				staffId,
				inviteId,
			);

			// mark previous failures resolved
			await this.activationFailureRepo.resolveByStaffId(staffId);

			await this.staffEvents.staffActivated({
				staffId,
			});

			return activatedStaff;
		} catch (error: any) {
            console.log(error);
            
			// track failure
			await this.activationFailureRepo.recordFailure({
				id: `ACTIVATION-FAIL-${this.idGenerator.generate()}`,
				staffId,
				inviteId,

				failureStage: this.resolveFailureStage(error),

				failureReason: error.message,

				firstFailedAt: new Date(),
				lastFailedAt: new Date(),
			});

			throw error;
		}
	}

	private resolveFailureStage(error: any): string {
		if (error.message.includes("capability")) {
			return "CAPABILITY_MAPPING";
		}

		if (error.message.includes("designation")) {
			return "DESIGNATION";
		}

		return "UNKNOWN";
	}
}

export default ActivationOrchestratorUseCase;