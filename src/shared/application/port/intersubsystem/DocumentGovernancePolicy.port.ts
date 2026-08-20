type GovernanceDocumentSensitivity =
	| "public"
	| "internal"
	| "confidential"
	| "restricted";

type DocumentGovernanceAction =
	| "assign_sensitivity"
	| "change_sensitivity"
	| "discover"
	| "view"
	| "forward"
	| "export"
	| "print"
	| "attach"
	| "manage_cc"
	| "render_cc_header";

type GovernanceActorRelationship =
	| "author"
	| "named_individual"
	| "target_handler"
	| "authorized_custodian"
	| "unit_head"
	| "delegated_unit_head"
	| "guest_reader"
	| "primary_authorizing_desk";

interface DocumentGovernanceFacts {
	sensitivity: GovernanceDocumentSensitivity;
	relationships?: GovernanceActorRelationship[];
	isAuthenticatedInternalStaff?: boolean;
	forwardDestination?: "internal" | "external";
	hasRecordedJustification?: boolean;
	hasDowngradeApproval?: boolean;
	isSensitivityDowngrade?: boolean;
	hasRequiredClearance?: boolean;
	hasActiveGuestReaderGrant?: boolean;
	hasEffectiveUnitHeadSignature?: boolean;
	exportGrant?: {
		active: boolean;
		grantedBy: "originator" | "unit_head";
		expiresAt?: Date | null;
		remainingUses?: number | null;
	} | null;
	isInternalCanvas?: boolean;
}

interface DocumentGovernanceDecision {
	allowed: boolean;
	policyId: string;
	policyVersion: number;
	reasonCode: string;
	obligations: string[];
}

interface GovernancePolicyReference {
	policyId: string;
	policyVersion: number;
}

interface DocumentGovernancePolicyPort {
	getSensitivityLevels(): readonly GovernanceDocumentSensitivity[];

	evaluateAction(
		action: DocumentGovernanceAction,
		facts: DocumentGovernanceFacts,
		policyReference: GovernancePolicyReference,
	): Promise<DocumentGovernanceDecision>;

	getActivePolicyReference(): Promise<GovernancePolicyReference>;
}

export type {
	DocumentGovernanceDecision,
	DocumentGovernanceAction,
	DocumentGovernanceFacts,
	DocumentGovernancePolicyPort,
	GovernanceActorRelationship,
	GovernancePolicyReference,
	GovernanceDocumentSensitivity,
};
