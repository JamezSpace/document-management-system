import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
	DOCUMENT_GOVERNANCE_POLICY,
} from "../../src/policy/domain/documentGovernance/DocumentGovernancePolicy.js";
import DocumentGovernancePolicyEvaluator from "../../src/policy/domain/documentGovernance/DocumentGovernancePolicyEvaluator.js";
import { DocumentActorRelationship } from "../../src/policy/domain/enum/documentActorRelationship.enum.js";
import { DocumentGovernanceAction } from "../../src/policy/domain/enum/documentGovernanceAction.enum.js";
import { GovernanceObligation } from "../../src/policy/domain/enum/governanceObligation.enum.js";
import { GovernanceSensitivityLevel } from "../../src/policy/domain/enum/governanceSensitivityLevel.enum.js";

const evaluate = DocumentGovernancePolicyEvaluator.evaluate.bind(
	DocumentGovernancePolicyEvaluator,
);

test("the governance policy has a stable identity and classification-time version binding", () => {
	assert.equal(DOCUMENT_GOVERNANCE_POLICY.id, "NEXUSFONS-DOCUMENT-GOVERNANCE");
	assert.equal(DOCUMENT_GOVERNANCE_POLICY.version, 1);
	assert.equal(
		DOCUMENT_GOVERNANCE_POLICY.classification.versionBinding,
		"classification_time",
	);
});

test("only the author may assign sensitivity", () => {
	assert.equal(
		evaluate({
			action: DocumentGovernanceAction.ASSIGN_SENSITIVITY,
			sensitivity: GovernanceSensitivityLevel.INTERNAL,
			relationships: [DocumentActorRelationship.AUTHOR],
		}).allowed,
		true,
	);
	assert.equal(
		evaluate({
			action: DocumentGovernanceAction.ASSIGN_SENSITIVITY,
			sensitivity: GovernanceSensitivityLevel.INTERNAL,
			relationships: [DocumentActorRelationship.UNIT_HEAD],
		}).allowed,
		false,
	);
});

test("a sensitivity downgrade requires approval and a recorded reason", () => {
	const denied = evaluate({
		action: DocumentGovernanceAction.CHANGE_SENSITIVITY,
		sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL,
		relationships: [DocumentActorRelationship.AUTHOR],
		isSensitivityDowngrade: true,
		hasDowngradeApproval: true,
		hasRecordedJustification: false,
	});
	assert.equal(denied.allowed, false);
	assert.ok(denied.obligations.includes(GovernanceObligation.REQUIRE_REASON));

	const allowed = evaluate({
		action: DocumentGovernanceAction.CHANGE_SENSITIVITY,
		sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL,
		relationships: [DocumentActorRelationship.AUTHOR],
		isSensitivityDowngrade: true,
		hasDowngradeApproval: true,
		hasRecordedJustification: true,
	});
	assert.equal(allowed.allowed, true);
});

test("internal forwarding cannot target an external destination", () => {
	assert.equal(
		evaluate({
			action: DocumentGovernanceAction.FORWARD,
			sensitivity: GovernanceSensitivityLevel.INTERNAL,
			isAuthenticatedInternalStaff: true,
			forwardDestination: "external",
		}).allowed,
		false,
	);
});

test("internal exports require a traceability watermark", () => {
	const decision = evaluate({
		action: DocumentGovernanceAction.EXPORT,
		sensitivity: GovernanceSensitivityLevel.INTERNAL,
		isAuthenticatedInternalStaff: true,
	});

	assert.equal(decision.allowed, true);
	assert.ok(
		decision.obligations.includes(
			GovernanceObligation.INTERNAL_TRACEABILITY_WATERMARK,
		),
	);
});

test("confidential reads are limited to explicit handlers and custodians", () => {
	const handler = evaluate({
		action: DocumentGovernanceAction.VIEW,
		sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL,
		relationships: [DocumentActorRelationship.TARGET_HANDLER],
	});
	const unrelatedStaff = evaluate({
		action: DocumentGovernanceAction.VIEW,
		sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL,
		isAuthenticatedInternalStaff: true,
	});

	assert.equal(handler.allowed, true);
	assert.equal(unrelatedStaff.allowed, false);
	assert.ok(
		handler.obligations.includes(GovernanceObligation.AUDIT_SECURITY_EVENT),
	);
});

test("confidential forwarding requires custody and an audited justification", () => {
	const withoutReason = evaluate({
		action: DocumentGovernanceAction.FORWARD,
		sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL,
		relationships: [DocumentActorRelationship.AUTHORIZED_CUSTODIAN],
		hasRecordedJustification: false,
	});
	const withReason = evaluate({
		action: DocumentGovernanceAction.FORWARD,
		sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL,
		relationships: [DocumentActorRelationship.AUTHORIZED_CUSTODIAN],
		hasRecordedJustification: true,
	});

	assert.equal(withoutReason.allowed, false);
	assert.equal(withReason.allowed, true);
	assert.ok(
		withReason.obligations.includes(
			GovernanceObligation.AUDIT_JUSTIFICATION,
		),
	);
});

test("confidential exports require an active dynamic grant and watermark", () => {
	const decision = evaluate({
		action: DocumentGovernanceAction.EXPORT,
		sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL,
		exportGrant: {
			active: true,
			grantedBy: "originator",
			expiresAt: new Date("2100-01-01T00:00:00.000Z"),
			remainingUses: 1,
		},
	});

	assert.equal(decision.allowed, true);
	assert.ok(
		decision.obligations.includes(
			GovernanceObligation.IDENTITY_TIMESTAMP_WATERMARK,
		),
	);
});

test("restricted reads require a named individual and sufficient clearance", () => {
	const missingClearance = evaluate({
		action: DocumentGovernanceAction.VIEW,
		sensitivity: GovernanceSensitivityLevel.RESTRICTED,
		relationships: [DocumentActorRelationship.NAMED_INDIVIDUAL],
		hasRequiredClearance: false,
	});
	const clearedNamedIndividual = evaluate({
		action: DocumentGovernanceAction.VIEW,
		sensitivity: GovernanceSensitivityLevel.RESTRICTED,
		relationships: [DocumentActorRelationship.NAMED_INDIVIDUAL],
		hasRequiredClearance: true,
	});

	assert.equal(missingClearance.allowed, false);
	assert.equal(clearedNamedIndividual.allowed, true);
	assert.equal(
		evaluate({
			action: DocumentGovernanceAction.EXPORT,
			sensitivity: GovernanceSensitivityLevel.RESTRICTED,
		}).allowed,
		false,
	);
});

test("confidential and restricted attachments are blocked", () => {
	for (const sensitivity of [
		GovernanceSensitivityLevel.CONFIDENTIAL,
		GovernanceSensitivityLevel.RESTRICTED,
	]) {
		assert.equal(
			evaluate({
				action: DocumentGovernanceAction.ATTACH,
				sensitivity,
			}).allowed,
			false,
		);
	}
});

test("CC headers are redacted for confidential documents", () => {
	const decision = evaluate({
		action: DocumentGovernanceAction.RENDER_CC_HEADER,
		sensitivity: GovernanceSensitivityLevel.CONFIDENTIAL,
	});

	assert.equal(decision.allowed, false);
	assert.ok(
		decision.obligations.includes(GovernanceObligation.REDACT_CC_HEADER),
	);
});
