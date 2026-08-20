import type { DocumentActorRelationship } from "../enum/documentActorRelationship.enum.js";
import type { DocumentGovernanceAction } from "../enum/documentGovernanceAction.enum.js";
import type { GovernanceSensitivityLevel } from "../enum/governanceSensitivityLevel.enum.js";
import type { DynamicExportGrant } from "./dynamicExportGrant.type.js";
import type { ForwardDestination } from "./forwardDestination.type.js";

interface DocumentGovernanceContext {
	action: DocumentGovernanceAction;
	sensitivity: GovernanceSensitivityLevel;
	relationships?: DocumentActorRelationship[];
	isAuthenticatedInternalStaff?: boolean;
	forwardDestination?: ForwardDestination;
	hasRecordedJustification?: boolean;
	hasDowngradeApproval?: boolean;
	isSensitivityDowngrade?: boolean;
	hasRequiredClearance?: boolean;
	hasActiveGuestReaderGrant?: boolean;
	hasEffectiveUnitHeadSignature?: boolean;
	exportGrant?: DynamicExportGrant | null;
	isInternalCanvas?: boolean;
}

export type { DocumentGovernanceContext };
