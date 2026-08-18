import type { GovernanceObligation } from "../enum/governanceObligation.enum.js";

interface GovernanceDecision {
	allowed: boolean;
	policyId: string;
	policyVersion: number;
	reasonCode: string;
	obligations: GovernanceObligation[];
}

export type { GovernanceDecision };
