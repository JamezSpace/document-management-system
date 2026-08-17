import type { MinuteRepositoryPort } from "../../ports/repos/MinuteRepository.port.js";

class GetMinutesByDocumentIdUseCase {
	constructor(private readonly minuteRepo: MinuteRepositoryPort) {}

	async execute(documentId: string) {
		return this.minuteRepo.findByDocumentId(documentId);
	}
}

export default GetMinutesByDocumentIdUseCase;
