import { DocumentGovernanceRuleEffect } from "../enum/documentGovernanceRuleEffect.enum.js";
import type { DocumentGovernancePolicy } from "./DocumentGovernancePolicy.js";
import type { DocumentGovernanceContext } from "../type/documentGovernanceContext.type.js";
import type { GovernanceDecision } from "../type/governanceDecision.type.js";

class DocumentGovernancePolicyEvaluator {
	static evaluate(
		policy: DocumentGovernancePolicy,
		context: DocumentGovernanceContext,
	): GovernanceDecision {
		const candidates = policy.rules.filter(
			(rule) =>
				rule.action === context.action &&
				(rule.sensitivity === null ||
					rule.sensitivity === context.sensitivity),
		);

		for (const rule of candidates) {
			if (!rule.matches(context)) continue;

			return {
				allowed: rule.effect === DocumentGovernanceRuleEffect.ALLOW,
				policyId: policy.policyKey,
				policyVersion: policy.policyVersion,
				reasonCode: rule.reasonCode,
				obligations: [...rule.obligations],
			};
		}

		const nearestRule = candidates[0];
		return {
			allowed: false,
			policyId: policy.policyKey,
			policyVersion: policy.policyVersion,
			reasonCode: nearestRule?.reasonCode ?? "governance_rule_not_found",
			obligations: nearestRule ? [...nearestRule.obligations] : [],
		};
	}
}

export default DocumentGovernancePolicyEvaluator;
