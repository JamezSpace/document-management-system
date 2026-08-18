import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
	DocumentGovernancePolicy,
} from "../../src/policy/domain/documentGovernance/DocumentGovernancePolicy.js";
import DocumentGovernancePolicyEvaluator from "../../src/policy/domain/documentGovernance/DocumentGovernancePolicyEvaluator.js";
import {
	DocumentGovernanceRule,
} from "../../src/policy/domain/documentGovernance/DocumentGovernanceRule.js";
import type { DocumentGovernanceContext } from "../../src/policy/domain/type/documentGovernanceContext.type.js";
import type { DocumentGovernanceRuleConditions } from "../../src/policy/domain/type/documentGovernanceRuleConditions.type.js";
import { DocumentActorRelationship } from "../../src/policy/domain/enum/documentActorRelationship.enum.js";
import { DocumentGovernanceAction } from "../../src/policy/domain/enum/documentGovernanceAction.enum.js";
import { DocumentGovernancePolicyStatus } from "../../src/policy/domain/enum/documentGovernancePolicyStatus.enum.js";
import { DocumentGovernanceRuleEffect } from "../../src/policy/domain/enum/documentGovernanceRuleEffect.enum.js";
import { GovernanceObligation } from "../../src/policy/domain/enum/governanceObligation.enum.js";
import { GovernanceSensitivityLevel } from "../../src/policy/domain/enum/governanceSensitivityLevel.enum.js";

let ruleSequence = 0;

function rule(payload: {
	action: DocumentGovernanceAction;
	sensitivity?: GovernanceSensitivityLevel | null;
	effect?: DocumentGovernanceRuleEffect;
	conditions?: DocumentGovernanceRuleConditions;
	obligations?: GovernanceObligation[];
	reasonCode: string;
}) {
	ruleSequence += 1;
	return new DocumentGovernanceRule({
		id: `RULE-${ruleSequence}`,
		sensitivity: payload.sensitivity ?? null,
		action: payload.action,
		effect: payload.effect ?? DocumentGovernanceRuleEffect.ALLOW,
		conditions: payload.conditions ?? {},
		obligations: payload.obligations ?? [],
		reasonCode: payload.reasonCode,
		priority: 10,
	});
}

function policy(rules: DocumentGovernanceRule[]) {
	return new DocumentGovernancePolicy({
		id: "POLICY-ROW-1",
		policyKey: "NEXUSFONS-DOCUMENT-GOVERNANCE",
		policyVersion: 1,
		schemaVersion: 1,
		status: DocumentGovernancePolicyStatus.ACTIVE,
		effectiveFrom: new Date("2026-08-18T00:00:00.000Z"),
		definitionChecksum: "a".repeat(64),
		createdBy: "staff.system",
		approvedBy: "staff.system",
		approvalReason: "Test approval",
		createdAt: new Date("2026-08-17T00:00:00.000Z"),
		approvedAt: new Date("2026-08-17T01:00:00.000Z"),
		metadata: { defaultEffect: "deny" },
		rules,
	});
}

function evaluate(
	context: DocumentGovernanceContext,
	rules: DocumentGovernanceRule[],
) {
	return DocumentGovernancePolicyEvaluator.evaluate(policy(rules), context);
}

test("the hydrated policy preserves its database identity and version", () => {
	const hydrated = policy([
		rule({ action: DocumentGovernanceAction.VIEW, reasonCode: "view" }),
	]);
	assert.equal(hydrated.policyKey, "NEXUSFONS-DOCUMENT-GOVERNANCE");
	assert.equal(hydrated.policyVersion, 1);
	assert.equal(hydrated.metadata.defaultEffect, "deny");
});

test("unknown rule conditions are rejected while loading", () => {
	assert.throws(
		() =>
			new DocumentGovernanceRule({
				id: "INVALID",
				sensitivity: null,
				action: DocumentGovernanceAction.VIEW,
				effect: DocumentGovernanceRuleEffect.ALLOW,
				conditions: { silentBypass: true } as any,
				obligations: [],
				reasonCode: "invalid",
				priority: 1,
			}),
		(error: any) => error.errorCode === "invalid_governance_policy",
	);
});

test("only the author may assign sensitivity", () => {
	const rules = [
		rule({
			action: DocumentGovernanceAction.ASSIGN_SENSITIVITY,
			conditions: { relationshipsAny: [DocumentActorRelationship.AUTHOR] },
			reasonCode: "sensitivity_assignment_author_only",
		}),
	];
	assert.equal(evaluate({ action: DocumentGovernanceAction.ASSIGN_SENSITIVITY, sensitivity: GovernanceSensitivityLevel.INTERNAL, relationships: [DocumentActorRelationship.AUTHOR] }, rules).allowed, true);
	assert.equal(evaluate({ action: DocumentGovernanceAction.ASSIGN_SENSITIVITY, sensitivity: GovernanceSensitivityLevel.INTERNAL, relationships: [DocumentActorRelationship.UNIT_HEAD] }, rules).allowed, false);
});

test("a sensitivity downgrade requires approval and a recorded reason", () => {
	const rules = [
		rule({
			action: DocumentGovernanceAction.CHANGE_SENSITIVITY,
			conditions: {
				relationshipsAny: [DocumentActorRelationship.AUTHOR],
				downgradeRequiresApproval: true,
				downgradeRequiresReason: true,
			},
			obligations: [GovernanceObligation.REQUIRE_DOWNGRADE_APPROVAL, GovernanceObligation.REQUIRE_REASON, GovernanceObligation.AUDIT_SECURITY_EVENT],
			reasonCode: "sensitivity_downgrade_requires_approval_and_reason",
		}),
	];
	const base = {
		action: DocumentGovernanceAction.CHANGE_SENSITIVITY,
		sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL,
		relationships: [DocumentActorRelationship.AUTHOR],
		isSensitivityDowngrade: true,
		hasDowngradeApproval: true,
	};
	const denied = evaluate({ ...base, hasRecordedJustification: false }, rules);
	const allowed = evaluate({ ...base, hasRecordedJustification: true }, rules);
	assert.equal(denied.allowed, false);
	assert.ok(denied.obligations.includes(GovernanceObligation.REQUIRE_REASON));
	assert.equal(allowed.allowed, true);
});

test("internal forwarding cannot target an external destination", () => {
	const rules = [rule({ action: DocumentGovernanceAction.FORWARD, sensitivity: GovernanceSensitivityLevel.INTERNAL, conditions: { authenticatedInternalStaff: true, forwardDestination: "internal" }, reasonCode: "internal_forwarding_must_remain_internal" })];
	assert.equal(evaluate({ action: DocumentGovernanceAction.FORWARD, sensitivity: GovernanceSensitivityLevel.INTERNAL, isAuthenticatedInternalStaff: true, forwardDestination: "external" }, rules).allowed, false);
});

test("internal exports require a traceability watermark", () => {
	const rules = [rule({ action: DocumentGovernanceAction.EXPORT, sensitivity: GovernanceSensitivityLevel.INTERNAL, conditions: { authenticatedInternalStaff: true }, obligations: [GovernanceObligation.INTERNAL_TRACEABILITY_WATERMARK], reasonCode: "internal_extraction_requires_internal_actor" })];
	const decision = evaluate({ action: DocumentGovernanceAction.EXPORT, sensitivity: GovernanceSensitivityLevel.INTERNAL, isAuthenticatedInternalStaff: true }, rules);
	assert.equal(decision.allowed, true);
	assert.ok(decision.obligations.includes(GovernanceObligation.INTERNAL_TRACEABILITY_WATERMARK));
});

test("confidential reads require an explicit relationship and active guest grant", () => {
	const rules = [rule({
		action: DocumentGovernanceAction.VIEW,
		sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL,
		conditions: { relationshipsAny: [DocumentActorRelationship.TARGET_HANDLER, DocumentActorRelationship.GUEST_READER], guestReaderRequiresActiveGrant: true },
		obligations: [GovernanceObligation.AUDIT_SECURITY_EVENT],
		reasonCode: "confidential_explicit_or_custodian_access_only",
	})];
	assert.equal(evaluate({ action: DocumentGovernanceAction.VIEW, sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL, relationships: [DocumentActorRelationship.TARGET_HANDLER] }, rules).allowed, true);
	assert.equal(evaluate({ action: DocumentGovernanceAction.VIEW, sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL, relationships: [DocumentActorRelationship.GUEST_READER], hasActiveGuestReaderGrant: false }, rules).allowed, false);
	assert.equal(evaluate({ action: DocumentGovernanceAction.VIEW, sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL, relationships: [DocumentActorRelationship.GUEST_READER], hasActiveGuestReaderGrant: true }, rules).allowed, true);
});

test("confidential forwarding requires custody and justification", () => {
	const rules = [rule({ action: DocumentGovernanceAction.FORWARD, sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL, conditions: { relationshipsAny: [DocumentActorRelationship.AUTHORIZED_CUSTODIAN], recordedJustification: true }, obligations: [GovernanceObligation.AUDIT_JUSTIFICATION], reasonCode: "confidential_forward_requires_custody_and_justification" })];
	assert.equal(evaluate({ action: DocumentGovernanceAction.FORWARD, sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL, relationships: [DocumentActorRelationship.AUTHORIZED_CUSTODIAN], hasRecordedJustification: false }, rules).allowed, false);
	const allowed = evaluate({ action: DocumentGovernanceAction.FORWARD, sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL, relationships: [DocumentActorRelationship.AUTHORIZED_CUSTODIAN], hasRecordedJustification: true }, rules);
	assert.equal(allowed.allowed, true);
	assert.ok(allowed.obligations.includes(GovernanceObligation.AUDIT_JUSTIFICATION));
});

test("confidential exports require a live dynamic grant", () => {
	const rules = [rule({ action: DocumentGovernanceAction.EXPORT, sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL, conditions: { activeUnexpiredDynamicGrant: true }, obligations: [GovernanceObligation.IDENTITY_TIMESTAMP_WATERMARK], reasonCode: "confidential_extraction_requires_dynamic_grant" })];
	const allowed = evaluate({ action: DocumentGovernanceAction.EXPORT, sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL, exportGrant: { active: true, grantedBy: "originator", expiresAt: new Date("2100-01-01"), remainingUses: 1 } }, rules);
	const expired = evaluate({ action: DocumentGovernanceAction.EXPORT, sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL, exportGrant: { active: true, grantedBy: "originator", expiresAt: new Date("2000-01-01") } }, rules);
	assert.equal(allowed.allowed, true);
	assert.equal(expired.allowed, false);
});

test("restricted extraction and confidential attachments are explicitly denied", () => {
	const rules = [
		rule({ action: DocumentGovernanceAction.EXPORT, sensitivity: GovernanceSensitivityLevel.RESTRICTED, effect: DocumentGovernanceRuleEffect.DENY, reasonCode: "restricted_extraction_prohibited" }),
		rule({ action: DocumentGovernanceAction.ATTACH, sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL, effect: DocumentGovernanceRuleEffect.DENY, reasonCode: "attachments_blocked_for_sensitive_document" }),
	];
	assert.equal(evaluate({ action: DocumentGovernanceAction.EXPORT, sensitivity: GovernanceSensitivityLevel.RESTRICTED }, rules).allowed, false);
	assert.equal(evaluate({ action: DocumentGovernanceAction.ATTACH, sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL }, rules).allowed, false);
});

test("a missing stored action rule fails closed", () => {
	const decision = evaluate(
		{ action: DocumentGovernanceAction.PRINT, sensitivity: GovernanceSensitivityLevel.PUBLIC },
		[rule({ action: DocumentGovernanceAction.VIEW, reasonCode: "view" })],
	);
	assert.equal(decision.allowed, false);
	assert.equal(decision.reasonCode, "governance_rule_not_found");
});
