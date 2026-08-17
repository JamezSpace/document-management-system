import { strict as assert } from "node:assert";
import { test } from "node:test";

import type { IdGeneratorPort } from "../../src/shared/application/port/services/IdGenerator.port.js";
import DomainError from "../../src/shared/errors/DomainError.error.js";
import type { TransactionContext } from "../../src/shared/infrastructure/persistence/primary/postgres.js";
import type { AccessEventsPort } from "../../src/i & a/access/application/ports/AccessEvents.port.js";
import type { RoleAssignmentRepositoryPort } from "../../src/i & a/access/application/ports/RoleAssignmentsRepository.port.js";
import AssignOfficialRoleUseCase from "../../src/i & a/access/application/usecases/AssignOfficialRole.js";
import Permission from "../../src/i & a/access/domain/permission/Permission.js";
import Role from "../../src/i & a/access/domain/role/Role.js";
import RoleAssignment, {
	RoleAssignmentSource,
} from "../../src/i & a/access/domain/RoleAssignment.js";

const start = new Date("2026-08-01T00:00:00.000Z");
const end = new Date("2026-09-01T00:00:00.000Z");

function role(id = "role.registry", name = "registry") {
	return new Role(
		id,
		name,
		new Set([new Permission("registry.intake.view")]),
	);
}

function assignment(
	overrides: Partial<ConstructorParameters<typeof RoleAssignment>[0]> = {},
) {
	return new RoleAssignment({
		id: "assignment-1",
		staffId: "staff-1",
		role: role(),
		scope: { type: "office", id: "office-1" },
		source: RoleAssignmentSource.MANUAL,
		validFrom: start,
		validTo: end,
		assignedBy: "staff-admin",
		...overrides,
	});
}

test("role assignment validity uses a half-open interval", () => {
	const value = assignment();

	assert.equal(value.isActive(new Date(start)), true);
	assert.equal(value.isActive(new Date(end.getTime() - 1)), true);
	assert.equal(value.isActive(new Date(end)), false);
});

test("invalid validity and delegated provenance are rejected", () => {
	assert.throws(
		() => assignment({ validTo: new Date(start) }),
		(error: unknown) => {
			assert.ok(error instanceof DomainError);
			assert.equal(error.errorCode, "invalid_role_assignment_validity");
			return true;
		},
	);

	assert.throws(
		() =>
			assignment({
				source: RoleAssignmentSource.DELEGATED,
				delegatedBy: "staff-admin",
				validTo: null,
			}),
		(error: unknown) => {
			assert.ok(error instanceof DomainError);
			assert.equal(error.errorCode, "delegated_role_missing_expiry");
			return true;
		},
	);
});

test("revocation closes the existing assignment and records provenance", () => {
	const value = assignment();
	const revokedAt = new Date("2026-08-15T00:00:00.000Z");

	value.revoke("staff-admin", revokedAt);

	assert.equal(value.getValidTo()?.toISOString(), revokedAt.toISOString());
	assert.equal(value.getRevokedAt()?.toISOString(), revokedAt.toISOString());
	assert.equal(value.getRevokedBy(), "staff-admin");
	assert.equal(value.isActive(revokedAt), false);
	assert.throws(() => value.revoke("staff-admin", revokedAt));
});

test("roles compare permissions by capability code", () => {
	assert.equal(role().hasPermission(new Permission("registry.intake.view")), true);
});

class MemoryAssignments implements RoleAssignmentRepositoryPort {
	readonly values: RoleAssignment[] = [];

	async insert(value: RoleAssignment): Promise<RoleAssignment> {
		this.values.push(value);
		return value;
	}

	async findById(id: string): Promise<RoleAssignment | null> {
		return this.values.find((value) => value.id === id) ?? null;
	}

	async findByStaffId(staffId: string): Promise<RoleAssignment[]> {
		return this.values.filter((value) => value.staffId === staffId);
	}

	async findEffectiveByStaffId(
		staffId: string,
		at: Date,
	): Promise<RoleAssignment[]> {
		return this.values.filter(
			(value) => value.staffId === staffId && value.isActive(at),
		);
	}

	async revoke(
		_value: RoleAssignment,
		_tx?: TransactionContext,
	): Promise<void> {}
}

const noOpEvents: AccessEventsPort = {
	officialRoleAssigned: async () => {},
	roleDelegated: async () => {},
	roleRevoked: async () => {},
	roleCreated: async () => {},
};

test("derived assignment supports multiple simultaneous duty roles", async () => {
	const repository = new MemoryAssignments();
	let sequence = 0;
	const generator: IdGeneratorPort = {
		generate: () => String(++sequence),
	};
	const useCase = new AssignOfficialRoleUseCase(
		noOpEvents,
		repository,
		generator,
	);

	await useCase.execute({
		staffId: "staff-1",
		role: role("role.intake", "intake"),
		scope: { type: "office", id: "office-1" },
		validFrom: start,
	});
	await useCase.execute({
		staffId: "staff-1",
		role: role("role.dispatch", "dispatch"),
		scope: { type: "office", id: "office-1" },
		validFrom: start,
	});

	assert.deepEqual(
		repository.values.map((value) => value.role.name),
		["intake", "dispatch"],
	);
});
