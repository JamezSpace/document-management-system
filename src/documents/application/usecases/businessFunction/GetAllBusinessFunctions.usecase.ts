import type { BusinessFunctionRepositoryPort } from "../../ports/repos/BusinessFunctionRepository.port.js";

class GetAllBusinessFunctionsUseCase {
    constructor(
		private readonly bussFunctionRepo: BusinessFunctionRepositoryPort,
	) {}

    async getAll() {
        return this.bussFunctionRepo.fetchAll()
    }
}

export default GetAllBusinessFunctionsUseCase;