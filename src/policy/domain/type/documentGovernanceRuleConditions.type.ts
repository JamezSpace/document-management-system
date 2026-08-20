import type { DocumentActorRelationship } from "../enum/documentActorRelationship.enum.js";
import type { ForwardDestination } from "./forwardDestination.type.js";

interface DocumentGovernanceRuleConditions {
	relationshipsAny?: DocumentActorRelationship[];
	authenticatedInternalStaff?: boolean;
	forwardDestination?: ForwardDestination;
	recordedJustification?: boolean;
	activeUnexpiredDynamicGrant?: boolean;
	requiredClearance?: boolean;
	internalCanvas?: boolean;
	guestReaderRequiresActiveGrant?: boolean;
	effectiveUnitHeadSignature?: boolean;
	downgradeRequiresApproval?: boolean;
	downgradeRequiresReason?: boolean;
}

export type { DocumentGovernanceRuleConditions };
