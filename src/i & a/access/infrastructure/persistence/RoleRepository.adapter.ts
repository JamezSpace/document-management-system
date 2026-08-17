import type { PostgresDb } from "@fastify/postgres";
import { Category, GlobalInfrastructureErrors } from "../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { RoleRepositoryPort } from "../../application/ports/RolesRepository.port.js";
import Permission from "../../domain/permission/Permission.js";
import type Role from "../../domain/role/Role.js";
import RoleEntity from "../../domain/role/Role.js";

class qlRoleRepositoryAdapter implements RoleRepositoryPort {
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
			return new RoleEntity(roleId, data.name, new Set(data.permissions.values()));
		});
	}

    async findAll(): Promise<Role[]> {
        try {
			const query = `
				SELECT
					r.id AS role_id,
					r.name AS role_name,
					p.code AS permission_code
				FROM identity.roles r
				LEFT JOIN identity.role_permissions rp ON rp.role_id = r.id
				LEFT JOIN identity.permissions p ON p.id = rp.permission_id
				ORDER BY r.name ASC;
			`;

			const result = await this.dbPool.query(query);

			if (!result.rows || result.rows.length === 0) return [];

			return this.mapRoles(result.rows);
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

    async findById(id: string): Promise<Role | null> {
        try {
			const query = `
				SELECT
					r.id AS role_id,
					r.name AS role_name,
					p.code AS permission_code
				FROM identity.roles r
				LEFT JOIN identity.role_permissions rp ON rp.role_id = r.id
				LEFT JOIN identity.permissions p ON p.id = rp.permission_id
				WHERE r.id = $1;
			`;

			const result = await this.dbPool.query(query, [id]);

			if (!result.rows || result.rows.length === 0) return null;

			return this.mapRoles(result.rows)[0] ?? null;
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

    async findByName(name: string): Promise<Role | null> {
        try {
			const query = `
				SELECT
					r.id AS role_id,
					r.name AS role_name,
					p.code AS permission_code
				FROM identity.roles r
				LEFT JOIN identity.role_permissions rp ON rp.role_id = r.id
				LEFT JOIN identity.permissions p ON p.id = rp.permission_id
				WHERE r.name = $1;
			`;

			const result = await this.dbPool.query(query, [name]);

			if (!result.rows || result.rows.length === 0) return null;

			return this.mapRoles(result.rows)[0] ?? null;
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

    async save(role: Role): Promise<void> {
        try {
			const insertRoleQuery = `
				INSERT INTO identity.roles (id, name, created_at)
				VALUES ($1, $2, NOW());
			`;

			await this.dbPool.query(insertRoleQuery, [role.getId(), role.name]);

			const permissions = role.getPermissions();

			if (permissions.length === 0) return;

			const insertPermissionQuery = `
				INSERT INTO identity.role_permissions (role_id, permission_id)
				SELECT $1, p.id
				FROM identity.permissions p
				WHERE p.code = $2
				ON CONFLICT DO NOTHING;
			`;

			for (const permission of permissions) {
				await this.dbPool.query(insertPermissionQuery, [
					role.getId(),
					permission.getCode(),
				]);
			}
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
}

export default qlRoleRepositoryAdapter;
