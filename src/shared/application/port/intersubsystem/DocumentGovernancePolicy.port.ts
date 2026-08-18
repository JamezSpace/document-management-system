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

interface DocumentGovernancePolicyPort {
	getSensitivityLevels(): readonly GovernanceDocumentSensitivity[];

	evaluateWorkspaceAction(
		action: WorkspaceGovernanceAction,
		facts: WorkspaceGovernanceFacts,
	): DocumentGovernanceDecision;

	getPolicyReference(): {
		policyId: string;
		policyVersion: number;
	};
}

export type {
	DocumentGovernanceDecision,
	DocumentGovernancePolicyPort,
	GovernanceDocumentSensitivity,
	WorkspaceGovernanceAction,
	WorkspaceGovernanceFacts,
};
