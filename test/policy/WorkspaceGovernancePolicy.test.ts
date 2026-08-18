import { strict as assert } from "node:assert";
import { test } from "node:test";

import DocumentGovernancePolicyService from "../../src/policy/application/services/DocumentGovernancePolicy.service.js";
import { DocumentGovernancePolicy } from "../../src/policy/domain/documentGovernance/DocumentGovernancePolicy.js";
import { DocumentGovernanceRule } from "../../src/policy/domain/documentGovernance/DocumentGovernanceRule.js";
import { DocumentActorRelationship } from "../../src/policy/domain/enum/documentActorRelationship.enum.js";
import { DocumentGovernanceAction } from "../../src/policy/domain/enum/documentGovernanceAction.enum.js";
import { DocumentGovernancePolicyStatus } from "../../src/policy/domain/enum/documentGovernancePolicyStatus.enum.js";
import { DocumentGovernanceRuleEffect } from "../../src/policy/domain/enum/documentGovernanceRuleEffect.enum.js";
import { GovernanceObligation } from "../../src/policy/domain/enum/governanceObligation.enum.js";
import { GovernanceSensitivityLevel } from "../../src/policy/domain/enum/governanceSensitivityLevel.enum.js";
import { LifecycleState } from "../../src/documents/domain/enum/lifecycleState.enum.js";
import { WorkspaceActions } from "../../src/orchestration/workspace/application/enum/WorkspaceActions.enum.js";
import WorkspacePolicyEvaluator from "../../src/orchestration/workspace/application/services/WorkspacePolicyEvaluator.js";

const policyKey = "NEXUSFONS-DOCUMENT-GOVERNANCE";
let sequence = 0;

function workspacePolicy() {
	const rules: DocumentGovernanceRule[] = [];
	const add = (
		action: DocumentGovernanceAction,
		sensitivity: GovernanceSensitivityLevel,
		effect: DocumentGovernanceRuleEffect,
		conditions: Record<string, unknown> = {},
		obligations: GovernanceObligation[] = [],
	) => {
		sequence += 1;
		rules.push(new DocumentGovernanceRule({
			id: `WORKSPACE-RULE-${sequence}`,
			action,
			sensitivity,
			effect,
			conditions: conditions as any,
			obligations,
			reasonCode: `workspace_${action}_${sensitivity}`,
			priority: 10,
		}));
	};

	for (const sensitivity of [GovernanceSensitivityLevel.PUBLIC, GovernanceSensitivityLevel.INTERNAL]) {
		add(DocumentGovernanceAction.ATTACH, sensitivity, DocumentGovernanceRuleEffect.ALLOW);
	}
	for (const sensitivity of [GovernanceSensitivityLevel.CONFIDENTIAL, GovernanceSensitivityLevel.RESTRICTED]) {
		add(DocumentGovernanceAction.ATTACH, sensitivity, DocumentGovernanceRuleEffect.DENY);
	}
	for (const sensitivity of [GovernanceSensitivityLevel.PUBLIC, GovernanceSensitivityLevel.INTERNAL, GovernanceSensitivityLevel.CONFIDENTIAL]) {
		add(DocumentGovernanceAction.MANAGE_CC, sensitivity, DocumentGovernanceRuleEffect.ALLOW, { relationshipsAny: [DocumentActorRelationship.AUTHOR] });
	}
	add(DocumentGovernanceAction.MANAGE_CC, GovernanceSensitivityLevel.RESTRICTED, DocumentGovernanceRuleEffect.ALLOW, { relationshipsAny: [DocumentActorRelationship.PRIMARY_AUTHORIZING_DESK] });
	add(DocumentGovernanceAction.EXPORT, GovernanceSensitivityLevel.INTERNAL, DocumentGovernanceRuleEffect.ALLOW, { authenticatedInternalStaff: true }, [GovernanceObligation.INTERNAL_TRACEABILITY_WATERMARK]);
	add(DocumentGovernanceAction.EXPORT, GovernanceSensitivityLevel.CONFIDENTIAL, DocumentGovernanceRuleEffect.ALLOW, { activeUnexpiredDynamicGrant: true });

	return new DocumentGovernancePolicy({
		id: "POLICY-ROW-1",
		policyKey,
		policyVersion: 1,
		schemaVersion: 1,
		status: DocumentGovernancePolicyStatus.ACTIVE,
		effectiveFrom: new Date("2026-08-18"),
		definitionChecksum: "b".repeat(64),
		createdBy: "staff.system",
		approvedBy: "staff.system",
		approvalReason: "Test approval",
		createdAt: new Date("2026-08-17T00:00:00.000Z"),
		approvedAt: new Date("2026-08-17T01:00:00.000Z"),
		metadata: { defaultEffect: "deny" },
		rules,
	});
}

const storedPolicy = workspacePolicy();
let versionLoads = 0;
const documentGovernancePolicy = new DocumentGovernancePolicyService({
	findActive: async () => storedPolicy,
	findByVersion: async () => {
		versionLoads += 1;
		return storedPolicy;
	},
});

function documentFixture(
	sensitivity: GovernanceSensitivityLevel,
	state: LifecycleState | null = null,
) {
	return {
		id: "DOC-1",
		ownerId: "STAFF-1",
		classification: {
			sensitivity,
			governancePolicyKey: policyKey,
			governancePolicyVersion: 1,
		},
		correspondence: { direction: "external" },
		getCurrentVersion: () => state ? { getState: () => state } : null,
	} as any;
}

test("workspace blocks sensitive attachments while retaining author CC for confidential drafts", async () => {
	const workspace = await WorkspacePolicyEvaluator.eval(documentFixture(GovernanceSensitivityLevel.CONFIDENTIAL), null, { id: "STAFF-1" }, documentGovernancePolicy);
	assert.equal(workspace.authorizedActions.includes(WorkspaceActions.ATTACH), false);
	assert.equal(workspace.authorizedActions.includes(WorkspaceActions.CC), true);
	assert.equal(workspace.governance.policyVersion, 1);
});

test("workspace does not grant restricted CC or attachment actions by default", async () => {
	const workspace = await WorkspacePolicyEvaluator.eval(documentFixture(GovernanceSensitivityLevel.RESTRICTED), null, { id: "STAFF-1" }, documentGovernancePolicy);
	assert.equal(workspace.authorizedActions.includes(WorkspaceActions.ATTACH), false);
	assert.equal(workspace.authorizedActions.includes(WorkspaceActions.CC), false);
});

test("workspace uses the document-bound policy version and caches immutable versions", async () => {
	const before = versionLoads;
	const internalWorkspace = await WorkspacePolicyEvaluator.eval(documentFixture(GovernanceSensitivityLevel.INTERNAL, LifecycleState.ACTIVE), null, { id: "STAFF-1" }, documentGovernancePolicy);
	const confidentialWorkspace = await WorkspacePolicyEvaluator.eval(documentFixture(GovernanceSensitivityLevel.CONFIDENTIAL, LifecycleState.ACTIVE), null, { id: "STAFF-1" }, documentGovernancePolicy);
	assert.equal(internalWorkspace.authorizedActions.includes(WorkspaceActions.EXPORT), true);
	assert.equal(confidentialWorkspace.authorizedActions.includes(WorkspaceActions.EXPORT), false);
	assert.ok(versionLoads - before <= 1);
});

test("workspace fails closed for legacy documents without a policy binding", async () => {
	const document = documentFixture(GovernanceSensitivityLevel.PUBLIC);
	delete document.classification.governancePolicyKey;
	await assert.rejects(
		WorkspacePolicyEvaluator.eval(document, null, { id: "STAFF-1" }, documentGovernancePolicy),
		(error: any) => error.errorCode === "policy_not_found",
	);
});
