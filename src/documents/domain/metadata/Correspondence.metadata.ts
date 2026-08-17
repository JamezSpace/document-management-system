import type { CorrespondenceDirection } from "../enum/correspondenceDirection.enum.js";

interface CorrespondenceMetadata {
	originatingUnitId: string;
	subjectCodeId: string;
    direction: CorrespondenceDirection;
}

export type { CorrespondenceMetadata };

