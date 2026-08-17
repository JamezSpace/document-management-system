import CorrespondenceSubject from "../../../domain/entities/correspondenceSubject/CorrespondenceSubject.js";
import type { CorrespondenceSubjectEventsPort } from "../../ports/events/CorrespondenceSubjectEvents.port.js";
import type { CorrespondenceSubjectRepositoryPort } from "../../ports/repos/CorrespondenceRepository.port.js";

class CreateCorrespondenceSubjectUseCase {
	constructor(
		private readonly correspondenceSubjectEvents: CorrespondenceSubjectEventsPort,
		private readonly correspondenceSubjectRepo: CorrespondenceSubjectRepositoryPort,
	) {}

	async createCorrespondenceSubject(payload: {
		code: string;
		name: string;
		description?: string | null;
	}) {
		const correspondenceSubjectId = "CORR-SUBJ-" + payload.code;

		const correspondenceSubject = new CorrespondenceSubject({
			id: correspondenceSubjectId,
			code: payload.code,
			name: payload.name,
			description: payload.description ?? null,
		});

		const newCorrespondenceSubject =
			await this.correspondenceSubjectRepo.save(correspondenceSubject);

		if (newCorrespondenceSubject) {
			await this.correspondenceSubjectEvents.correspondenceSubjectCreated(
				{
					correspondenceSubjectId:
						newCorrespondenceSubject.getCorrespondenceSubjectId(),
				},
			);
		}

		return newCorrespondenceSubject;
	}
}

export default CreateCorrespondenceSubjectUseCase;
