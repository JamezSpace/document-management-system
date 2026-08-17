import BusinessFunction from "../../../domain/entities/businessFunction/BusinessFunction.js";
import type { BusinessFunctionEventsPort } from "../../ports/events/BusinessFunctionEvents.port.js";
import type { BusinessFunctionRepositoryPort } from "../../ports/repos/BusinessFunctionRepository.port.js";

class CreateBusinessFunctionUseCase {
	constructor(
		private readonly businessFunctionEvents: BusinessFunctionEventsPort,
		private readonly businessFunctionRepo: BusinessFunctionRepositoryPort,
	) {}

	async createBusinessFunction(
		actorId: string,
		payload: {
            subjectId: string;
			code: string;
			name: string;
			description?: string | null;
		},
	) {
		const businessFunctionId = "BUS-FUNC-" + payload.code;

		const businessFunction = new BusinessFunction({
			id: businessFunctionId,
            subjectId: payload.subjectId,
			code: payload.code,
			name: payload.name,
			description: payload.description ?? null,
		});

		const newBusinessFunction =
			await this.businessFunctionRepo.save(businessFunction);

		if (newBusinessFunction) {
			await this.businessFunctionEvents.businessFunctionCreated({
				businessFunction:{
                    id: newBusinessFunction.getBusinessFunctionId(),
                    name: businessFunction.name
                },
                actorId
			});
		}

		return newBusinessFunction;
	}
}

export default CreateBusinessFunctionUseCase;
