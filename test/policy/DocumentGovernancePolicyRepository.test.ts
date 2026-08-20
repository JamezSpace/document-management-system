import { strict as assert } from "node:assert";
import { test } from "node:test";

import DocumentGovernancePolicyService from "../../src/policy/application/services/DocumentGovernancePolicy.service.js";
import { DocumentGovernanceAction } from "../../src/policy/domain/enum/documentGovernanceAction.enum.js";
import DocumentGovernancePolicyRepositoryAdapter from "../../src/policy/infrastructre/persistence/DocumentGovernancePolicyRepository.adapter.js";

function storedPolicyRow(overrides: Record<string, unknown> = {}) {
	return {
		id: "POLICY-ROW-1",
		policy_key: "nexusfons_document_governance",
		policy_version: 4,
		schema_version: 1,
		status: "active",
		effective_from: "2026-01-01T00:00:00.000Z",
		effective_to: null,
		definition_checksum: "c".repeat(64),
		created_by: "staff.system",
		approved_by: "staff.system",
		approval_reason: "Test approval",
		created_at: "2026-01-01T00:00:00.000Z",
		approved_at: "2026-01-01T01:00:00.000Z",
		metadata: { defaultEffect: "deny" },
		rule_id: "RULE-1",
		rule_sensitivity: "internal",
		rule_action: "export",
		rule_effect: "allow",
		rule_conditions: { authenticatedInternalStaff: true },
		rule_obligations: ["internal_traceability_watermark"],
		rule_reason_code: "internal_export",
		rule_priority: 10,
		...overrides,
	};
}

test("repository hydrates the active policy header and its typed rules", async () => {
	let queryText = "";
	let parameters: unknown[] = [];
	const repository = new DocumentGovernancePolicyRepositoryAdapter({
		query: async (query: string, values: unknown[]) => {
			queryText = query;
			parameters = values;
			return { rows: [storedPolicyRow()] };
		},
	} as any);
	const effectiveAt = new Date("2026-08-18T10:00:00.000Z");

	const policy = await repository.findActive(
		"nexusfons_document_governance",
		effectiveAt,
	);

	assert.match(queryText, /status = 'active'/);
	assert.match(queryText, /effective_from <= \$2/);
	assert.deepEqual(parameters, ["nexusfons_document_governance", effectiveAt]);
	assert.equal(policy?.policyVersion, 4);
	assert.equal(policy?.rules[0]?.action, DocumentGovernanceAction.EXPORT);
});

test("repository rejects malformed stored rule conditions", async () => {
	const repository = new DocumentGovernancePolicyRepositoryAdapter({
		query: async () => ({
			rows: [storedPolicyRow({ rule_conditions: { allowEverything: true } })],
		}),
	} as any);

	await assert.rejects(
		repository.findByVersion("nexusfons_document_governance", 4),
		(error: any) => error.errorCode === "invalid_governance_policy",
	);
});

test("application service caches active and immutable version lookups", async () => {
	const hydrationRepository = new DocumentGovernancePolicyRepositoryAdapter({
		query: async () => ({ rows: [storedPolicyRow()] }),
	} as any);
	const stored = await hydrationRepository.findByVersion(
		"nexusfons_document_governance",
		4,
	);
	assert.ok(stored);

	let activeLoads = 0;
	let versionLoads = 0;
	const service = new DocumentGovernancePolicyService({
		findActive: async () => {
			activeLoads += 1;
			return stored;
		},
		findByVersion: async () => {
			versionLoads += 1;
			return stored;
		},
	});

	const reference = await service.getActivePolicyReference();
	await service.getActivePolicyReference();
	const decision = await service.evaluateAction(
		"export",
		{
			sensitivity: "internal",
			relationships: [],
			isAuthenticatedInternalStaff: true,
		},
		reference,
	);

	assert.deepEqual(reference, {
		policyId: "nexusfons_document_governance",
		policyVersion: 4,
	});
	assert.equal(decision.allowed, true);
	assert.equal(activeLoads, 1);
	assert.equal(versionLoads, 0);
});

test("application service does not fall back when a bound version is missing", async () => {
	const service = new DocumentGovernancePolicyService({
		findActive: async () => null,
		findByVersion: async () => null,
	});

	await assert.rejects(
		service.evaluateAction(
			"attach",
			{
				sensitivity: "public",
				relationships: ["author"],
				isAuthenticatedInternalStaff: true,
			},
			{ policyId: "nexusfons_document_governance", policyVersion: 99 },
		),
		(error: any) => error.errorCode === "policy_not_found",
	);
});
