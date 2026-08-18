type GovernanceDocumentSensitivity =
	| "public"
	| "internal"
	| "confidential"
	| "restricted";

type WorkspaceGovernanceAction = "attach" | "export" | "manage_cc";

interface WorkspaceGovernanceFacts {
	sensitivity: GovernanceDocumentSensitivity;
	isAuthor: boolean;
	isAuthenticatedInternalStaff: boolean;
	isPrimaryAuthorizingDesk?: boolean;
	hasActiveExportGrant?: boolean;
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

	evaluateWorkspaceAction(
		action: WorkspaceGovernanceAction,
		facts: WorkspaceGovernanceFacts,
		policyReference: GovernancePolicyReference,
	): Promise<DocumentGovernanceDecision>;

	getActivePolicyReference(): Promise<GovernancePolicyReference>;
}

export type {
	DocumentGovernanceDecision,
	DocumentGovernancePolicyPort,
	GovernancePolicyReference,
	GovernanceDocumentSensitivity,
	WorkspaceGovernanceAction,
	WorkspaceGovernanceFacts,
};
