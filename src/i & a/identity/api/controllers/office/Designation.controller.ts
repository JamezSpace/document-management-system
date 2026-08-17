import type AddNewDesignationUseCase from "../../../application/usecases/office/AddNewDesignation.usecase.js";
import type GetAllDesignationUseCase from "../../../application/usecases/office/GetAllDesignations.usecase.js";
import type { CreateDesignationType } from "../../types/office/office.type.js";

class DesignationController {
	constructor(
		private readonly addDesignationUseCase: AddNewDesignationUseCase,
		private readonly getAllDesignationUseCase: GetAllDesignationUseCase,
	) {}

	async addNewDesignation(payload: CreateDesignationType) {
		const designationPayload: CreateDesignationType = {
			title: payload.title,
			officeId: payload.officeId,
		};

		if (payload.description !== undefined) {
			designationPayload.description = payload.description;
		}

		const newDesignation =
			await this.addDesignationUseCase.execute(designationPayload);

		return newDesignation;
	}

	async getAllDesignationsWithinAnOffice(officeId: string) {
		const allDesignations =
			this.getAllDesignationUseCase.fetchAllByOffice(officeId);

		return allDesignations;
	}

    async getAllDesignations() {
		const allDesignations =
			this.getAllDesignationUseCase.fetchAll();

		return allDesignations;
	}
}

export default DesignationController;
