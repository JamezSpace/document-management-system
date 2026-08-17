import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { DesignationCapabilityClassRepositoryPort } from "../../application/ports/repos/mappings/DesigCapClassRepository.port.js";
import type { ClassificationServicePort } from "../../application/ports/services/ClassificationService.port.js";
import type StaffCapabilityClass from "../../domain/entities/staff/StaffCapabilityClass.js";

class ClassificationServiceAdapter implements ClassificationServicePort {
	constructor(
		private readonly designCapClassRepo: DesignationCapabilityClassRepositoryPort
	) {}

	async getDefaultCapabilityClassFromDesignation(
		designationId: string,
		tx?: TransactionContext,
	): Promise<StaffCapabilityClass | null> {
		const capabilityClass =
			await this.designCapClassRepo.findDefaultCapabilityClassByDesignationId(
				designationId,
                tx
			);

		if (!capabilityClass) return null;

		return capabilityClass;
	}
}

export default ClassificationServiceAdapter;
