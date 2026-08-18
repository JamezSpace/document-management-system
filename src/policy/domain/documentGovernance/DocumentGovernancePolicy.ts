import { DocumentActorRelationship } from "../enum/documentActorRelationship.enum.js";
import { DocumentGovernanceAction } from "../enum/documentGovernanceAction.enum.js";
import { GovernanceSensitivityLevel } from "../enum/governanceSensitivityLevel.enum.js";
import { GovernanceObligation } from "../enum/governanceObligation.enum.js";

type ForwardDestination = "internal" | "external";
type RestrictedGrantBasis = "named_individual" | "ex_officio";

interface DynamicExportGrant {
	active: boolean;
	grantedBy: "originator" | "unit_head";
	expiresAt?: Date | null;
	remainingUses?: number | null;
}

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
	exportGrant?: DynamicExportGrant | null;
	isInternalCanvas?: boolean;
}

interface GovernanceDecision {
	allowed: boolean;
	policyId: string;
	policyVersion: number;
	reasonCode: string;
	obligations: GovernanceObligation[];
}

const DOCUMENT_GOVERNANCE_POLICY = Object.freeze({
	id: "NEXUSFONS-DOCUMENT-GOVERNANCE",
	version: 1,
	effectiveFrom: "2026-08-18",
	classification: {
		assignmentAuthority: DocumentActorRelationship.AUTHOR,
		downgrade: {
			requiresApproval: true,
			requiresRecordedReason: true,
			approvers: [
				DocumentActorRelationship.UNIT_HEAD,
				DocumentActorRelationship.DELEGATED_UNIT_HEAD,
			],
		},
		versionBinding: "classification_time",
	},
	delegation: {
		requireExactlyOneEffectiveUnitHead: true,
		activeDelegationSupersedesSubstantiveUnitHead: true,
		requireStartAndEndTime: true,
		forbidOverlappingDelegations: true,
	},
	transfer: {
		defaultWorkspaceCustody: "revoke",
		publicAndInternal: "general_read_only",
		confidential: "revoke_unless_time_bound_guest_reader_grant",
		restricted: {
			exOfficio: "transfer_to_incoming_desk_holder",
			personSpecific: "retain_only_if_clearance_remains_sufficient",
		},
		placeOutstandingWorkInHandover: true,
		preserveHistoricalActorAttribution: true,
	},
	audit: {
		publicAndInternalViews: "operational_http_log",
		confidentialAndRestrictedViews: "immutable_security_audit",
		alwaysAudit: [
			"download",
			"export",
			"print",
			"external_forward",
			"direct_dispatch",
			"reclassify",
			"grant_access",
			"revoke_access",
			"custody_handover",
			"clearance_override",
			"denied_access",
			"signature_verification_failure",
		],
		mandatoryReasonActions: [
			"reclassify_downgrade",
			"grant_explicit_access",
			"clearance_override",
			"confidential_forward",
		],
		integrity: {
			appendOnly: true,
			hashChained: true,
			externalSignedCheckpointsRecommended: true,
		},
	},
	restricted: {
		roleInheritanceAllowed: false,
		requiresNamedIndividualAndClearance: true,
		forwardingAllowed: false,
		exportAllowed: false,
		printingAllowed: false,
		rawDownloadAllowed: false,
		screenCaptureControl: "best_effort_drm_deterrence",
	},
} as const);

export {
	DOCUMENT_GOVERNANCE_POLICY,
	type DocumentGovernanceContext,
	type DynamicExportGrant,
	type ForwardDestination,
	type GovernanceDecision,
	type RestrictedGrantBasis,
};
