import { strict as assert } from "node:assert";
import { test } from "node:test";

import { createDocumentSchemaForCreation } from "../../src/documents/api/types/document.type.js";
import { GovernanceSensitivityLevel } from "../../src/policy/domain/enum/governanceSensitivityLevel.enum.js";
import DocumentGovernancePolicyService from "../../src/policy/application/services/DocumentGovernancePolicy.service.js";

test("document creation sensitivity validation is derived from the policy authority", () => {
	const policy = new DocumentGovernancePolicyService({
		findActive: async () => null,
		findByVersion: async () => null,
	});
	const policyLevels = policy.getSensitivityLevels();
	const schema = createDocumentSchemaForCreation(policyLevels);
	const sensitivitySchema = schema.properties.sensitivity as {
		anyOf: Array<{ const: string }>;
	};

	assert.deepEqual(policyLevels, Object.values(GovernanceSensitivityLevel));
	assert.deepEqual(
		sensitivitySchema.anyOf.map((entry) => entry.const),
		policyLevels,
	);
});
