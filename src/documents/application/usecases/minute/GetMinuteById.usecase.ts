import type { MinuteRepositoryPort } from "../../ports/repos/MinuteRepository.port.js";

class GetMinuteByIdUseCase {
	constructor(private readonly minuteRepo: MinuteRepositoryPort) {}

	async execute(minuteId: string) {
		return this.minuteRepo.findById(minuteId);
	}
}

export default GetMinuteByIdUseCase;
