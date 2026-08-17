import { strict as assert } from "node:assert";
import { test } from "node:test";

import type { WorkflowAccessPort } from "../../src/shared/application/port/intersubsystem/WorkflowAccess.port.js";
import type { DocumentView } from "../../src/shared/application/port/intersubsystem/WorkflowDocument.port.js";
import { ResolutionStrategy } from "../../src/workflow/domain/enum/ResolutionStrategy.enum.js";
import ApproverResolverServiceAdapter from "../../src/workflow/infrastructure/services/ApproverResolverService.adapter.js";

interface RoleLookup {
	role: string;
	scope: { unitId?: string; officeId?: string };
}

class RecordingWorkflowAccess implements WorkflowAccessPort {
	readonly supervisorLookups: string[] = [];
	readonly hierarchyLookups: string[] = [];
	readonly roleLookups: RoleLookup[] = [];

	async findActiveSupervisor(
		staffId: string,
	): Promise<{ supervisorId: string } | null> {
		this.supervisorLookups.push(staffId);
		return { supervisorId: "supervisor-1" };
	}

	async findByHierarchy(
		staffId: string,
	): Promise<{ supervisorId: string } | null> {
		this.hierarchyLookups.push(staffId);
		return null;
	}

	async findByRoleAndScope(
		role: string,
		scope: { unitId?: string; officeId?: string },
	): Promise<string[]> {
		this.roleLookups.push({ role, scope });
		return ["scoped-approver-1"];
	}
}

function document(
	overrides: Partial<DocumentView["owner"]> = {},
): DocumentView {
	return {
		docId: "document-1",
		owner: {
			id: "owner-1",
			unitId: "unit-1",
			officeId: "office-1",
			designationId: "designation-1",
			...overrides,
		},
	};
}

test("direct-supervisor resolution reads the staff id from the nested document owner", async () => {
	const access = new RecordingWorkflowAccess();
	const resolver = new ApproverResolverServiceAdapter(access);

	const result = await resolver.resolve(
		document(),
		"supervisor",
		ResolutionStrategy.DIRECT_SUPERVISOR,
	);

	assert.deepEqual(result, ["supervisor-1"]);
	assert.deepEqual(access.supervisorLookups, ["owner-1"]);
	assert.deepEqual(access.hierarchyLookups, []);
});

test("role resolution uses the unit and office scopes nested under the document owner", async () => {
	const access = new RecordingWorkflowAccess();
	const resolver = new ApproverResolverServiceAdapter(access);

	assert.deepEqual(
		await resolver.resolve(
			document(),
			"unit-reviewer",
			ResolutionStrategy.ROLE_IN_UNIT,
		),
		["scoped-approver-1"],
	);
	assert.deepEqual(
		await resolver.resolve(
			document(),
			"office-reviewer",
			ResolutionStrategy.ROLE_IN_OFFICE,
		),
		["scoped-approver-1"],
	);
	assert.deepEqual(access.roleLookups, [
		{ role: "unit-reviewer", scope: { unitId: "unit-1" } },
		{ role: "office-reviewer", scope: { officeId: "office-1" } },
	]);
});

test("missing unit and office scopes return no approvers without a broad role lookup", async () => {
	const access = new RecordingWorkflowAccess();
	const resolver = new ApproverResolverServiceAdapter(access);
	const unscopedDocument = document({ unitId: null, officeId: null });

	assert.deepEqual(
		await resolver.resolve(
			unscopedDocument,
			"unit-reviewer",
			ResolutionStrategy.ROLE_IN_UNIT,
		),
		[],
	);
	assert.deepEqual(
		await resolver.resolve(
			unscopedDocument,
			"office-reviewer",
			ResolutionStrategy.ROLE_IN_OFFICE,
		),
		[],
	);
	assert.deepEqual(access.roleLookups, []);
});
