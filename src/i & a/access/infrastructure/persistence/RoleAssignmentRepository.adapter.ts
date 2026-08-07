import type { PostgresDb } from "@fastify/postgres";
import InfrastructureError from "../../../../shared/errors/InfrastructureError.error.js";
import { Category, GlobalInfrastructureErrors } from "../../../../shared/errors/enum/infrastructure.enum.js";
import UuidV7Generator from "../../../../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import { mapPostgresError } from "../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { RoleAssignmentRepositoryPort } from "../../application/ports/RoleAssignmentsRepository.port.js";
import RoleAssignment, { RoleAssignmentSource } from "../../domain/RoleAssignment.js";
import Permission from "../../domain/permission/Permission.js";
import Role from "../../domain/role/Role.js";


class qlRoleAssignmentRepositoryAdapter implements RoleAssignmentRepositoryPort {
    constructor(private readonly dbPool: PostgresDb) {}
    
	private mapAssignments(rows: any[]): RoleAssignment[] {
		const assignmentMap = new Map<
			string,
			{
				staffId: string;
				roleId: string;
				roleName: string;
				permissions: Map<string, Permission>;
                source: RoleAssignmentSource;
				validFrom: Date;
				validTo?: Date | null;
				delegatedBy?: string | null;
			}
		>();

		rows.forEach((row) => {
			if (!assignmentMap.has(row.assignment_id)) {
				assignmentMap.set(row.assignment_id, {
					staffId: row.staff_id,
					roleId: row.role_id,
					roleName: row.role_name,
					permissions: new Map(),
                    source: row.source,
					validFrom: row.valid_from,
					validTo: row.valid_to,
					delegatedBy: row.delegated_by,
				});
			}

			if (row.permission_code) {
				const entry = assignmentMap.get(row.assignment_id)!;
				if (!entry.permissions.has(row.permission_code)) {
					entry.permissions.set(
						row.permission_code,
						new Permission(row.permission_code),
					);
				}
			}
		});

		return Array.from(assignmentMap.values()).map((entry) => {
			const role = new Role(
				entry.roleId,
				entry.roleName,
				new Set(entry.permissions.values()),
			);

            if(entry.delegatedBy && entry.validTo)
			return new RoleAssignment({
				identityId: entry.staffId,
				role,
                source: entry.source,
				validFrom: entry.validFrom,
				delegatedBy: entry.delegatedBy,
				validTo: entry.validTo ?? null,
			});
            else 
               return new RoleAssignment({
				identityId: entry.staffId,
				role,
                source: entry.source,
				validFrom: entry.validFrom
			}); 
		});
	}

    async save(roleAssignment: RoleAssignment, tx?: TransactionContext): Promise<RoleAssignment> {
        try {
			const idGenerator = new UuidV7Generator();
			const assignmentId = "ROLE-ASSIGN-" + idGenerator.generate();

			const query = `
				INSERT INTO identity.role_assignments (
					id, staff_id, role_id, scope, delegated_by, source, valid_from, valid_to, created_at
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
				RETURNING id;
			`;

            const executor = tx?.client ?? this.dbPool;

			await executor.query(query, [
				assignmentId,
				roleAssignment.staffId,
				roleAssignment.role.getId(),
				null,
				roleAssignment.delegatedBy ?? null,
				roleAssignment.source,
				roleAssignment.validFrom,
				roleAssignment.getValidTo() ?? null,
			]);

			return roleAssignment;
		} catch (error: any) {
			const postgresError = mapPostgresError(error);
			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
				table: postgresError.details?.table,
				column: postgresError.details?.column,
			});
		}
    }
    
    async findRoleAssignmentsByStaffId(staffId: string, tx?: TransactionContext): Promise<RoleAssignment[]> {
        try {
			const query = `
				SELECT
					ra.id AS assignment_id,
					ra.staff_id,
					ra.role_id,
					ra.delegated_by,
					ra.source,
					ra.valid_from,
					ra.valid_to,
					r.name AS role_name,
					p.code AS permission_code
				FROM identity.role_assignments ra
				INNER JOIN identity.roles r ON r.id = ra.role_id
				LEFT JOIN identity.role_permissions rp ON rp.role_id = r.id
				LEFT JOIN identity.permissions p ON p.id = rp.permission_id
				WHERE ra.staff_id = $1
				ORDER BY ra.valid_from DESC;
			`;

            const executor = tx?.client ?? this.dbPool;

			const result = await executor.query(query, [staffId]);

			if (!result.rows || result.rows.length === 0) return [];

			return this.mapAssignments(result.rows);
		} catch (error: any) {
			throw new InfrastructureError(
				GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
				{
					category: Category.PERSISTENCE,
					message: error.message,
				},
			);
		}
    }
   
}

export default qlRoleAssignmentRepositoryAdapter;
