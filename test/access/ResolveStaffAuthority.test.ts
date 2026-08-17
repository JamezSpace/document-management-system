import { strict as assert } from "node:assert";
import { test } from "node:test";

import type { TransactionContext } from "../../src/shared/infrastructure/persistence/primary/postgres.js";
import type { RoleAssignmentRepositoryPort } from "../../src/i & a/access/application/ports/RoleAssignmentsRepository.port.js";
import ResolveStaffAuthorityUseCase from "../../src/i & a/access/application/usecases/ResolveStaffAuthority.usecase.js";
import Permission from "../../src/i & a/access/domain/permission/Permission.js";
import Role from "../../src/i & a/access/domain/role/Role.js";
import RoleAssignment, {	RoleAssignmentSource } from "../../src/i & a/access/domain/RoleAssignment.js";

const effectiveAt = new Date("2026-08-15T00:00:00.000Z");

function effectiveAssignment(payload: {
	id: string;
	roleId: string;
	roleName: string;
	capabilities: string[];
	scope:
		| { type: "organization"; id: null }
		| { type: "unit"; id: string }
		| { type: "office"; id: string };
}) {
	return new RoleAssignment({
		id: payload.id,
		staffId: "staff-1",
		role: new Role(
			payload.roleId,
			payload.roleName,
			new Set(payload.capabilities.map((code) => new Permission(code))),
		),
		scope: payload.scope,
		source: RoleAssignmentSource.MANUAL,
		validFrom: new Date("2026-08-01T00:00:00.000Z"),
		assignedBy: "staff-admin",
	});
}

class EffectiveAssignments implements RoleAssignmentRepositoryPort {
	constructor(private readonly assignments: RoleAssignment[]) {}

	async insert(value: RoleAssignment): Promise<RoleAssignment> {
		return value;
	}

	async findById(id: string): Promise<RoleAssignment | null> {
		return this.assignments.find((value) => value.id === id) ?? null;
	}

	async findByStaffId(staffId: string): Promise<RoleAssignment[]> {
		return this.assignments.filter((value) => value.staffId === staffId);
	}

	async findEffectiveByStaffId(
		staffId: string,
		at: Date,
	): Promise<RoleAssignment[]> {
		return this.assignments.filter(
			(value) => value.staffId === staffId && value.isActive(at),
		);
	}

	async revoke(
		_value: RoleAssignment,
		_tx?: TransactionContext,
	): Promise<void> {}
}

test("staff authority returns flattened capabilities and their distinct scopes", async () => {
	const organization = effectiveAssignment({
		id: "assignment-organization",
		roleId: "role.staff_member",
		roleName: "staff_member",
		capabilities: ["document.view"],
		scope: { type: "organization", id: null },
	});
	const registry = effectiveAssignment({
		id: "assignment-registry",
		roleId: "role.registry_intake",
		roleName: "registry_intake_officer",
		capabilities: ["document.view", "registry.intake.create"],
		scope: { type: "office", id: "office-registry" },
	});
	const duplicateScope = effectiveAssignment({
		id: "assignment-registry-secondary",
		roleId: "role.registry_secondary",
		roleName: "registry_secondary",
		capabilities: ["registry.intake.create"],
		scope: { type: "office", id: "office-registry" },
	});
	const useCase = new ResolveStaffAuthorityUseCase(
		new EffectiveAssignments([registry, organization, duplicateScope]),
	);

	const result = await useCase.execute("staff-1", effectiveAt);

	assert.deepEqual(result.roles, [
		"registry_intake_officer",
		"registry_secondary",
		"staff_member",
	]);
	assert.deepEqual(result.capabilities, [
		"document.view",
		"registry.intake.create",
	]);
	assert.deepEqual(result.capabilityScopes, {
		"document.view": [
			{ type: "office", id: "office-registry" },
			{ type: "organization", id: null },
		],
		"registry.intake.create": [
			{ type: "office", id: "office-registry" },
		],
	});
	assert.equal(result.roleAssignments.length, 3);
	assert.equal(result.roleAssignments[0]?.assignmentId, "assignment-registry");
});
