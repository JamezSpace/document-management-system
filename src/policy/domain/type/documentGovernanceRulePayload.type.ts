import type { DocumentGovernanceAction } from "../enum/documentGovernanceAction.enum.js";
import type { DocumentGovernanceRuleEffect } from "../enum/documentGovernanceRuleEffect.enum.js";
import type { GovernanceObligation } from "../enum/governanceObligation.enum.js";
import type { GovernanceSensitivityLevel } from "../enum/governanceSensitivityLevel.enum.js";
import type { DocumentGovernanceRuleConditions } from "./documentGovernanceRuleConditions.type.js";

interface DocumentGovernanceRulePayload {
	id: string;
	sensitivity: GovernanceSensitivityLevel | null;
	action: DocumentGovernanceAction;
	effect: DocumentGovernanceRuleEffect;
	conditions: DocumentGovernanceRuleConditions;
	obligations: GovernanceObligation[];
	reasonCode: string;
	priority: number;
}

export type { DocumentGovernanceRulePayload };
