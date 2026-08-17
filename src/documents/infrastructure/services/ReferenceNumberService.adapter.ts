import type { ReferenceSequenceRepositoryPort } from "../../application/ports/repos/ReferenceSequenceRepository.port.js";
import type { ReferenceNumberServicePort } from "../../application/ports/services/ReferenceNumberService.port.js";
import type { RefNumPayload } from "../../application/types/refNum.type.js";

class ReferenceNumberService implements ReferenceNumberServicePort {
	constructor(private readonly refNumSeqRepo: ReferenceSequenceRepositoryPort) {}

	async generate(payload: RefNumPayload) {
		const result = await this.refNumSeqRepo.nextSequence(payload);

		const padded = result.nextCount.toString().padStart(4, "0");

        // internal same-unit memo
		if (
			result.recipientUnit &&
			result.originUnit === result.recipientUnit
		) {
			return `${payload.year}/${result.originUnit}/${payload.subjectCode}/${payload.functionCode}/${padded}`;
		}

		// cross-unit memo
		if (result.recipientUnit) {
			return `${payload.year}/${result.originUnit}/${result.recipientUnit}/${payload.subjectCode}/${payload.functionCode}/${padded}`;
		}

		// external/general
		return `${payload.year}/${result.originUnit}/${payload.subjectCode}/${payload.functionCode}/${padded}`;
	}
}

export default ReferenceNumberService;
