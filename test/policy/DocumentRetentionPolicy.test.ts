import { strict as assert } from "node:assert";
import { test } from "node:test";

import RetentionService from "../../src/documents/infrastructure/services/RetentionService.adapter.js";
import DocumentRetentionPolicy from "../../src/policy/domain/DocumentRetentionPolicy.js";
import DocumentRetentionPolicyAdapter from "../../src/policy/infrastructre/persistence/DocRetentionPolicy.adapter.js";

test("retention policies require positive whole-year durations", () => {
	for (const retentionDuration of [0, -1, 1.5]) {
		assert.throws(
			() =>
				new DocumentRetentionPolicy({
					id: "POLICY-1",
					documentTypeId: "TYPE-1",
					archivalRequired: false,
					retentionDuration,
					effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
				}),
			(error: any) => error.errorCode === "invalid_retention_policy",
		);
	}
});

test("retention lookup selects the policy effective on the classification date", async () => {
	let capturedQuery = "";
	let capturedParameters: unknown[] = [];
	const effectiveAt = new Date("2026-08-18T09:24:31.000Z");
	const database = {
		query: async (query: string, parameters: unknown[]) => {
			capturedQuery = query;
			capturedParameters = parameters;
			return {
				rows: [
					{
						id: "POLICY-1",
						policy_version: 2,
						retention_duration: 7,
						archival_required: true,
					},
				],
			};
		},
	};
	const adapter = new DocumentRetentionPolicyAdapter(database as any);

	const policy = await adapter.getRetentionData("TYPE-1", effectiveAt);

	assert.match(capturedQuery, /effective_from <= \$2::date/);
	assert.match(capturedQuery, /ORDER BY effective_from DESC, policy_version DESC/);
	assert.match(capturedQuery, /LIMIT 1/);
	assert.deepEqual(capturedParameters, ["TYPE-1", effectiveAt]);
	assert.deepEqual(policy, {
		duration: 7,
		archivalRequired: true,
		policyVersion: 2,
		retentionScheduleId: "POLICY-1",
	});
});

test("retention lookup returns null when no policy is effective", async () => {
	const adapter = new DocumentRetentionPolicyAdapter({
		query: async () => ({ rows: [] }),
	} as any);

	assert.equal(
		await adapter.getRetentionData("TYPE-1", new Date("2025-01-01")),
		null,
	);
});

test("document retention fails explicitly when a document type has no policy", async () => {
	const service = new RetentionService({
		getRetentionData: async () => null,
	});

	await assert.rejects(
		service.computeRetention("TYPE-1", new Date("2026-08-18")),
		(error: any) =>
			error.errorCode === "policy_not_found" &&
			error.httpStatusCode === 404,
	);
});

test("document retention binds the selected version and computes eligibility", async () => {
	const start = new Date("2024-02-29T10:00:00.000Z");
	const service = new RetentionService({
		getRetentionData: async () => ({
			duration: 5,
			archivalRequired: true,
			policyVersion: 3,
			retentionScheduleId: "POLICY-3",
		}),
	});

	const retention = await service.computeRetention("TYPE-1", start);

	assert.equal(retention.policyVersion, 3);
	assert.equal(retention.retentionScheduleId, "POLICY-3");
	assert.equal(
		retention.disposalEligibilityDate.toISOString(),
		"2029-02-28T10:00:00.000Z",
	);
	assert.equal(retention.archivalRequired, true);
});
