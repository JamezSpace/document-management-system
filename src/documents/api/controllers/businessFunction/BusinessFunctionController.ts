import type CreateBusinessFunctionUseCase from "../../../application/usecases/businessFunction/CreateBusinessFunction.usecase.js";
import type GetAllBusinessFunctionsUseCase from "../../../application/usecases/businessFunction/GetAllBusinessFunctions.usecase.js";

class BusinessFunctionController {
	constructor(
		private readonly createBusinessFunctionUseCase: CreateBusinessFunctionUseCase,
		private readonly getAllBusinessFunctionUseCase: GetAllBusinessFunctionsUseCase,
	) {}

	async createBusinessFunction(actorId: string, payload: {
		subjectId: string;
        code: string;
		name: string;
		description?: string | null;
	}) {
		const newBusinessFunction =
			await this.createBusinessFunctionUseCase.createBusinessFunction(
                actorId,
				payload,
			);

		return newBusinessFunction;
	}

    async getAllBussFunctions() {
        const allBussFunctions = await this.getAllBusinessFunctionUseCase.getAll()

        return allBussFunctions;
    }
}

export default BusinessFunctionController;
