import type CorrespondenceSubject from "../../../domain/entities/correspondenceSubject/CorrespondenceSubject.js";

interface CorrespondenceSubjectRepositoryPort {
	save(
		correspondenceSubject: CorrespondenceSubject,
	): Promise<CorrespondenceSubject>;

	updateCorrespondenceSubject(
		correspondenceSubjectId: string,
		changesToMake: Partial<CorrespondenceSubject>,
	): Promise<CorrespondenceSubject>;

	findCorrespondenceSubjectById(
		correspondenceSubjectId: string,
	): Promise<CorrespondenceSubject | null>;

    fetchAll(): Promise<CorrespondenceSubject[]>;
}

export type { CorrespondenceSubjectRepositoryPort };
