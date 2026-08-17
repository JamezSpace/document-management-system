import type { PostgresDb } from "@fastify/postgres";
import InfrastructureError from "../../../../../../shared/errors/InfrastructureError.error.js";
import { Category } from "../../../../../../shared/errors/enum/infrastructure.enum.js";
import { mapPostgresError } from "../../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { StaffCapabilityClassRepositoryPort } from "../../../../application/ports/repos/entities/staff/StaffCapabilityClassRepository.port.js";
import StaffCapabilityClass from "../../../../domain/entities/staff/StaffCapabilityClass.js";

class PostgresStaffCapabilityClassRepositoryAdapter
	implements StaffCapabilityClassRepositoryPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	async save(
		capabilityClass: StaffCapabilityClass,
	): Promise<StaffCapabilityClass> {
		try {
			const result = await this.dbPool.query(
				"INSERT INTO identity.capability_classes (id, name, category, description, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *",
				[
					capabilityClass.getStaffCapabilityClassId(),
					capabilityClass.name,
					capabilityClass.category,
					capabilityClass.description ?? null,
					capabilityClass.createdAt,
				],
			);

			const dbCapabilityClass = result.rows[0];

			return new StaffCapabilityClass({
				id: dbCapabilityClass.id,
				name: dbCapabilityClass.name,
				category: dbCapabilityClass.category,
				description: dbCapabilityClass.description,
				createdAt: dbCapabilityClass.created_at,
			});
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}

	async findStaffCapabilityClassById(
		id: string,
	): Promise<StaffCapabilityClass | null> {
		try {
			const result = await this.dbPool.query(
				"SELECT * FROM identity.capability_classes WHERE id = $1",
				[id],
			);

			const dbCapabilityClass = result.rows[0];

			if (!dbCapabilityClass) return null;

			return new StaffCapabilityClass({
				id: dbCapabilityClass.id,
				name: dbCapabilityClass.name,
				category: dbCapabilityClass.category,
				description: dbCapabilityClass.description,
				createdAt: dbCapabilityClass.created_at,
			});
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}

	async fetchAll(): Promise<StaffCapabilityClass[]> {
		try {
			const result = await this.dbPool.query(
				"SELECT * FROM identity.capability_classes ORDER BY name",
			);

			return result.rows.map(
				(capabilityClass) =>
					new StaffCapabilityClass({
						id: capabilityClass.id,
						name: capabilityClass.name,
						category: capabilityClass.category,
						description: capabilityClass.description,
						createdAt: capabilityClass.created_at,
					}),
			);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}
}

export default PostgresStaffCapabilityClassRepositoryAdapter;
