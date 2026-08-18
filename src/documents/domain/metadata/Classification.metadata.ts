import type { GovernanceDocumentSensitivity } from "../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";

interface ClassificationMetadata {
	sensitivity: GovernanceDocumentSensitivity;
	governancePolicyKey?: string | null;
	governancePolicyVersion?: number | null;
	functionCodeId: string;
	documentTypeId: string;

	classifiedBy: string;
	classifiedAt: Date;

	lastReclassifiedAt?: Date | null;
	lastReclassifiedBy?: string | null;
}

export type { ClassificationMetadata };
