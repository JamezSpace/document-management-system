import type { PostgresDb } from "@fastify/postgres";
import { Category } from "../../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../../../shared/infrastructure/persistence/primary/postgres.js";
import Permission from "../../../../access/domain/permission/Permission.js";
import Role from "../../../../access/domain/role/Role.js";
import type { CapabilityRoleRepositoryPort } from "../../../application/ports/repos/mappings/CapRoleRepository.port.js";

class CapRoleRepositoryAdapter implements CapabilityRoleRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private mapRoles(rows: any[]): Role[] {
		const roleMap = new Map<
			string,
			{ name: string; permissions: Map<string, Permission> }
		>();

		rows.forEach((row) => {
			if (!roleMap.has(row.role_id)) {
				roleMap.set(row.role_id, {
					name: row.role_name,
					permissions: new Map(),
				});
			}

			if (row.permission_code) {
				const roleEntry = roleMap.get(row.role_id)!;
				if (!roleEntry.permissions.has(row.permission_code)) {
					roleEntry.permissions.set(
						row.permission_code,
						new Permission(row.permission_code),
					);
				}
			}
		});

		return Array.from(roleMap.entries()).map(([roleId, data]) => {
			return new Role(roleId, data.name, new Set(data.permissions.values()));
		});
	}

	async findRolesByCapabilityClassId(
		capabilityClassId: string,
		tx?: TransactionContext,
	): Promise<Role[]> {
		try {
			const executor = tx?.client ?? this.dbPool;

			const query = `
				SELECT
					r.id AS role_id,
					r.name AS role_name,
					p.code AS permission_code
				FROM identity.capability_role_mappings crm
				INNER JOIN identity.roles r ON r.id = crm.role_id
				LEFT JOIN identity.role_permissions rp ON rp.role_id = r.id
				LEFT JOIN identity.permissions p ON p.id = rp.permission_id
				WHERE crm.capability_class_id = $1
				ORDER BY r.name ASC;
			`;

			const result = await executor.query(query, [capabilityClassId]);

			if (!result.rows || result.rows.length === 0) return [];

			return this.mapRoles(result.rows);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}
}

export default CapRoleRepositoryAdapter;
