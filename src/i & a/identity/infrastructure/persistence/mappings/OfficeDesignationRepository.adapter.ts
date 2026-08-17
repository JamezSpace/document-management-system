import type { PostgresDb } from "@fastify/postgres";
import { Category } from "../../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { OfficeDesignationRepositoryPort } from "../../../application/ports/repos/mappings/OfficeDesignationRepository.port.js";
import OfficeDesignation from "../../../domain/mappings/OfficeDesignation.js";

class OfficeDesignationRepositoryAdapter
	implements OfficeDesignationRepositoryPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	private toDomain(row: any): OfficeDesignation {
		return new OfficeDesignation({
			id: row.id,
			officeId: row.office_id,
			designationId: row.designation_id,
			hierarchyLevel: row.hierarchy_level,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		});
	}

	async findById(officeDesigId: string): Promise<OfficeDesignation | null> {
		try {
			const result = await this.dbPool.query(
				"SELECT * FROM identity.office_designations WHERE id = $1",
				[officeDesigId],
			);

			const officeDesignation = result.rows[0];

			if (!officeDesignation) return null;

			return this.toDomain(officeDesignation);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}

	async findDesignationWithinAnOffice(
		payload: { designationId: string; officeId: string },
		tx?: TransactionContext,
	): Promise<OfficeDesignation | null> {
		try {
			const executor = tx?.client ?? this.dbPool;

			const result = await executor.query(
				`SELECT *
				 FROM identity.office_designations
				 WHERE designation_id = $1
				   AND office_id = $2`,
				[payload.designationId, payload.officeId],
			);

			const officeDesignation = result.rows[0];

			if (!officeDesignation) return null;

			return this.toDomain(officeDesignation);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}
}

export default OfficeDesignationRepositoryAdapter;
