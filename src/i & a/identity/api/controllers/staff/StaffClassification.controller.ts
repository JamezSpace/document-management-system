import type CloseStaffClassificationUseCase from "../../../application/usecases/staff/classification/CloseStaffClassification.usecase.js";
import type UpdateStaffClassificationUseCase from "../../../application/usecases/staff/classification/CloseStaffClassification.usecase.js";
import type CreateStaffClassificationUseCase from "../../../application/usecases/staff/classification/CreateStaffClassification.usecase.js";
import type EditStaffClassificationMetadataUseCase from "../../../application/usecases/staff/classification/EditClassificationMetadata.usecase.js";
import type {
	CreateStaffClassificationType,
	EditStaffClassificationType,
} from "../../types/staff/staffClass.type.js";

class StaffClassificationController {
	constructor(
		private readonly createStaffClassUsecase: CreateStaffClassificationUseCase,
		private readonly editStaffClassificationMetadataUseCase: EditStaffClassificationMetadataUseCase,
		private readonly closeClassificationUseCase: CloseStaffClassificationUseCase,
	) {}

	async addNewStaffClassification(payload: CreateStaffClassificationType) {
		const newStaffClassification =
			await this.createStaffClassUsecase.createNewStaffClassification({
				...payload,
				effectiveFrom: new Date(payload.effectiveFrom),
				effectiveTo: new Date(payload.effectiveTo),
			});

		return newStaffClassification;
	}

	async closeStaffClassification(
		classificationId: string,
		closureDate: string,
	) {
		const closedStaffclassification =
			await this.closeClassificationUseCase.closeStaffClassification(
				classificationId,
				new Date(closureDate),
			);

        return closedStaffclassification;
	}

    async editStaffClassificationMetadata(
        classificationId: string,
        changesToMake: EditStaffClassificationType
    ) {
        const editedStaffClassification = await this.editStaffClassificationMetadataUseCase.editClassificationMetadata(classificationId, changesToMake)

        return editedStaffClassification
    }
}

export default StaffClassificationController;
