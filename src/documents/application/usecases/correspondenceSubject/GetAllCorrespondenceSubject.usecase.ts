import type { CorrespondenceSubjectRepositoryPort } from "../../ports/repos/CorrespondenceRepository.port.js";

class GetAllCorrespondenceSubjectUseCase {
    constructor(
		private readonly corrSubjectRepo: CorrespondenceSubjectRepositoryPort,
	) {}

    async getAll() {
        return this.corrSubjectRepo.fetchAll()
    }
}

export default GetAllCorrespondenceSubjectUseCase;