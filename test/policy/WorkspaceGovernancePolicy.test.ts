import { strict as assert } from "node:assert";
import { test } from "node:test";

import { GovernanceSensitivityLevel } from "../../src/policy/domain/enum/governanceSensitivityLevel.enum.js";
import { LifecycleState } from "../../src/documents/domain/enum/lifecycleState.enum.js";
import { WorkspaceActions } from "../../src/orchestration/workspace/application/enum/WorkspaceActions.enum.js";
import WorkspacePolicyEvaluator from "../../src/orchestration/workspace/application/services/WorkspacePolicyEvaluator.js";
import DocumentGovernancePolicyAdapter from "../../src/policy/infrastructre/adapters/DocumentGovernancePolicy.adapter.js";

const documentGovernancePolicy = new DocumentGovernancePolicyAdapter();

function documentFixture(
	sensitivity: GovernanceSensitivityLevel,
	state: LifecycleState | null = null,
) {
	return {
		ownerId: "STAFF-1",
		classification: { sensitivity },
		correspondence: { direction: "external" },
		getCurrentVersion: () =>
			state ? { getState: () => state } : null,
	} as any;
}

test("workspace blocks sensitive attachments while retaining author CC for confidential drafts", async () => {
	const workspace = await WorkspacePolicyEvaluator.eval(
		documentFixture(GovernanceSensitivityLevel.CONFIDENTIAL),
		null,
		{ id: "STAFF-1" },
		documentGovernancePolicy,
	);

	assert.equal(workspace.authorizedActions.includes(WorkspaceActions.ATTACH), false);
	assert.equal(workspace.authorizedActions.includes(WorkspaceActions.CC), true);
	assert.equal(workspace.governance.policyVersion, 1);
});

test("workspace does not grant restricted CC or attachment actions by default", async () => {
	const workspace = await WorkspacePolicyEvaluator.eval(
		documentFixture(GovernanceSensitivityLevel.RESTRICTED),
		null,
		{ id: "STAFF-1" },
		documentGovernancePolicy,
	);

	assert.equal(workspace.authorizedActions.includes(WorkspaceActions.ATTACH), false);
	assert.equal(workspace.authorizedActions.includes(WorkspaceActions.CC), false);
});

test("workspace grants internal export with policy enforcement but blocks confidential export without a grant", async () => {
	const internalWorkspace = await WorkspacePolicyEvaluator.eval(
		documentFixture(GovernanceSensitivityLevel.INTERNAL, LifecycleState.ACTIVE),
		null,
		{ id: "STAFF-1" },
		documentGovernancePolicy,
	);
	const confidentialWorkspace = await WorkspacePolicyEvaluator.eval(
		documentFixture(
			GovernanceSensitivityLevel.CONFIDENTIAL,
			LifecycleState.ACTIVE,
		),
		null,
		{ id: "STAFF-1" },
		documentGovernancePolicy,
	);

	assert.equal(
		internalWorkspace.authorizedActions.includes(WorkspaceActions.EXPORT),
		true,
	);
	assert.equal(
		confidentialWorkspace.authorizedActions.includes(WorkspaceActions.EXPORT),
		false,
	);
});
