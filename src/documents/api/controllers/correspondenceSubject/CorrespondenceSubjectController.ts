import type CreateCorrespondenceSubjectUseCase from "../../../application/usecases/correspondenceSubject/CreateCorrespondenceSubject.usecase.js";
import type GetAllCorrespondenceSubjectUseCase from "../../../application/usecases/correspondenceSubject/GetAllCorrespondenceSubject.usecase.js";

class CorrespondenceSubjectController {
	constructor(
		private readonly createCorrespondenceSubjectUseCase: CreateCorrespondenceSubjectUseCase,
        private readonly getAllCorrespondenceSubjectUseCase: GetAllCorrespondenceSubjectUseCase
	) {}

	async createCorrespondenceSubject(payload: {
		code: string;
		name: string;
		description?: string | null;
	}) {
		const newCorrespondenceSubject =
			await this.createCorrespondenceSubjectUseCase.createCorrespondenceSubject(
				payload,
			);

		return newCorrespondenceSubject;
	}


    async getAllCorrSubjects() {
        const allSubjects = await this.getAllCorrespondenceSubjectUseCase.getAll()

        return allSubjects;
    }
}

export default CorrespondenceSubjectController;
