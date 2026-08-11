import type { PostgresDb } from "@fastify/postgres";
import type { AuthorizationScope } from "../../../../security/application/type/authorization.type.js";
import InfrastructureError from "../../../../shared/errors/InfrastructureError.error.js";
import {
	Category,
	GlobalInfrastructureErrors,
} from "../../../../shared/errors/enum/infrastructure.enum.js";
import { mapPostgresError } from "../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { RoleAssignmentRepositoryPort } from "../../application/ports/RoleAssignmentsRepository.port.js";
import RoleAssignment, {
	RoleAssignmentSource,
} from "../../domain/RoleAssignment.js";
import Permission from "../../domain/permission/Permission.js";
import Role from "../../domain/role/Role.js";

interface AssignmentRow {
	assignment_id: string;
	staff_id: string;
	role_id: string;
	role_name: string;
	permission_code: string | null;
	scope_type: AuthorizationScope["type"];
	scope_unit_id: string | null;
	scope_office_id: string | null;
	source: RoleAssignmentSource;
	valid_from: Date;
	valid_to: Date | null;
	assigned_by: string;
	delegated_by: string | null;
	revoked_by: string | null;
	revoked_at: Date | null;
	created_at: Date;
}

interface AssignmentAccumulator {
	id: string;
	staffId: string;
	roleId: string;
	roleName: string;
	permissions: Map<string, Permission>;
	scope: AuthorizationScope;
	source: RoleAssignmentSource;
	validFrom: Date;
	validTo: Date | null;
	assignedBy: string;
	delegatedBy: string | null;
	revokedBy: string | null;
	revokedAt: Date | null;
	createdAt: Date;
}

class RoleAssignmentRepositoryAdapter
	implements RoleAssignmentRepositoryPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	async insert(
		roleAssignment: RoleAssignment,
		tx?: TransactionContext,
	): Promise<RoleAssignment> {
		const query = `
			INSERT INTO identity.role_assignments (
				id, staff_id, role_id,
				scope_type, scope_unit_id, scope_office_id,
				source, valid_from, valid_to,
				assigned_by, delegated_by, revoked_by, revoked_at, created_at
			) VALUES (
				$1, $2, $3,
				$4, $5, $6,
				$7, $8, $9,
				$10, $11, $12, $13, $14
			);
		`;

		try {
			const executor = tx?.client ?? this.dbPool;
			await executor.query(query, [
				roleAssignment.id,
				roleAssignment.staffId,
				roleAssignment.role.getId(),
				roleAssignment.scope.type,
				roleAssignment.scope.type === "unit"
					? roleAssignment.scope.id
					: null,
				roleAssignment.scope.type === "office"
					? roleAssignment.scope.id
					: null,
				roleAssignment.source,
				roleAssignment.validFrom,
				roleAssignment.getValidTo(),
				roleAssignment.assignedBy,
				roleAssignment.delegatedBy,
				roleAssignment.getRevokedBy(),
				roleAssignment.getRevokedAt(),
				roleAssignment.createdAt,
			]);

			return roleAssignment;
		} catch (error: unknown) {
			this.throwPersistenceError(error);
		}
	}

	async findById(
		assignmentId: string,
		tx?: TransactionContext,
		options?: { forUpdate?: boolean },
	): Promise<RoleAssignment | null> {
		const rows = await this.queryAssignments(
			`WHERE ra.id = $1`,
			[assignmentId],
			tx,
			options?.forUpdate === true,
		);

		return this.mapAssignments(rows)[0] ?? null;
	}

	async findByStaffId(
		staffId: string,
		tx?: TransactionContext,
	): Promise<RoleAssignment[]> {
		const rows = await this.queryAssignments(
			`WHERE ra.staff_id = $1`,
			[staffId],
			tx,
		);

		return this.mapAssignments(rows);
	}

	async findEffectiveByStaffId(
		staffId: string,
		at: Date,
		tx?: TransactionContext,
	): Promise<RoleAssignment[]> {
		const rows = await this.queryAssignments(
			`WHERE ra.staff_id = $1
			   AND ra.valid_from <= $2
			   AND (ra.valid_to IS NULL OR $2 < ra.valid_to)
			   AND (ra.revoked_at IS NULL OR $2 < ra.revoked_at)`,
			[staffId, at],
			tx,
		);

		return this.mapAssignments(rows);
	}

	async revoke(
		roleAssignment: RoleAssignment,
		tx?: TransactionContext,
	): Promise<void> {
		const revokedAt = roleAssignment.getRevokedAt();
		const revokedBy = roleAssignment.getRevokedBy();

		if (!revokedAt || !revokedBy) {
			throw new InfrastructureError(
				GlobalInfrastructureErrors.persistence.INVALID_OPERATION,
				{
					category: Category.PERSISTENCE,
					message: "A role assignment must be revoked in the domain before persistence",
				},
			);
		}

		try {
			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(
				`UPDATE identity.role_assignments
				 SET valid_to = $2, revoked_by = $3, revoked_at = $2
				 WHERE id = $1
				   AND revoked_at IS NULL
				   AND valid_from <= $2
				   AND (valid_to IS NULL OR $2 < valid_to)
				 RETURNING id;`,
				[roleAssignment.id, revokedAt, revokedBy],
			);

			if (result.rowCount !== 1) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.NOT_FOUND,
					{
						category: Category.PERSISTENCE,
						message: "Role assignment is no longer active",
					},
				);
			}
		} catch (error: unknown) {
			if (error instanceof InfrastructureError) throw error;
			this.throwPersistenceError(error);
		}
	}

	private async queryAssignments(
		whereClause: string,
		values: unknown[],
		tx?: TransactionContext,
		forUpdate = false,
	): Promise<AssignmentRow[]> {
		const lockingClause = forUpdate ? "FOR UPDATE OF ra" : "";
		const query = `
			SELECT
				ra.id AS assignment_id,
				ra.staff_id,
				ra.role_id,
				ra.scope_type,
				ra.scope_unit_id,
				ra.scope_office_id,
				ra.source,
				ra.valid_from,
				ra.valid_to,
				ra.assigned_by,
				ra.delegated_by,
				ra.revoked_by,
				ra.revoked_at,
				ra.created_at,
				r.name AS role_name,
				p.code AS permission_code
			FROM identity.role_assignments ra
			INNER JOIN identity.roles r ON r.id = ra.role_id
			LEFT JOIN identity.role_permissions rp ON rp.role_id = r.id
			LEFT JOIN identity.permissions p ON p.id = rp.permission_id
			${whereClause}
			ORDER BY ra.valid_from DESC, ra.id ASC
			${lockingClause};
		`;

		try {
			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query<AssignmentRow>(query, values);
			return result.rows;
		} catch (error: unknown) {
			this.throwPersistenceError(error);
		}
	}

	private mapAssignments(rows: AssignmentRow[]): RoleAssignment[] {
		const assignments = new Map<string, AssignmentAccumulator>();

		for (const row of rows) {
			let assignment = assignments.get(row.assignment_id);
			if (!assignment) {
				assignment = {
					id: row.assignment_id,
					staffId: row.staff_id,
					roleId: row.role_id,
					roleName: row.role_name,
					permissions: new Map(),
					scope: this.toScope(row),
					source: row.source,
					validFrom: row.valid_from,
					validTo: row.valid_to,
					assignedBy: row.assigned_by,
					delegatedBy: row.delegated_by,
					revokedBy: row.revoked_by,
					revokedAt: row.revoked_at,
					createdAt: row.created_at,
				};
				assignments.set(row.assignment_id, assignment);
			}

			if (row.permission_code) {
				assignment.permissions.set(
					row.permission_code,
					new Permission(row.permission_code),
				);
			}
		}

		return Array.from(assignments.values()).map((entry) => {
			const role = new Role(
				entry.roleId,
				entry.roleName,
				new Set(entry.permissions.values()),
			);

			return new RoleAssignment({
				id: entry.id,
				staffId: entry.staffId,
				role,
				scope: entry.scope,
				source: entry.source,
				validFrom: entry.validFrom,
				validTo: entry.validTo,
				assignedBy: entry.assignedBy,
				delegatedBy: entry.delegatedBy,
				revokedBy: entry.revokedBy,
				revokedAt: entry.revokedAt,
				createdAt: entry.createdAt,
			});
		});
	}

	private toScope(row: AssignmentRow): AuthorizationScope {
		switch (row.scope_type) {
			case "organization":
				return { type: "organization", id: null };
			case "unit":
				return { type: "unit", id: row.scope_unit_id ?? "" };
			case "office":
				return { type: "office", id: row.scope_office_id ?? "" };
		}
	}

	private throwPersistenceError(error: unknown): never {
		const candidate = error as { message?: string };
		const postgresError = mapPostgresError(error);
		throw new InfrastructureError(postgresError.summary, {
			category: Category.PERSISTENCE,
			message:
				postgresError.details?.message ??
				candidate.message ??
				"Role assignment persistence failed",
			table: postgresError.details?.table,
			column: postgresError.details?.column,
		});
	}
}

export default RoleAssignmentRepositoryAdapter;
