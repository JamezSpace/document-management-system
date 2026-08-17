import type { PostgresDb } from "@fastify/postgres";
import { Category } from "../../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { DesignationCapabilityClassRepositoryPort } from "../../../application/ports/repos/mappings/DesigCapClassRepository.port.js";
import StaffCapabilityClass from "../../../domain/entities/staff/StaffCapabilityClass.js";

class DesigCapClassRepositoryAdapter implements DesignationCapabilityClassRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}
    
    async findDefaultCapabilityClassByDesignationId(
		designationId: string,
        tx?: TransactionContext
	): Promise<StaffCapabilityClass | null> {
		try {
            const executor = tx?.client ?? this.dbPool;

			const result = await executor.query(
				`SELECT cap.*
				 FROM identity.designation_capability_defaults desig_cap
				 JOIN identity.capability_classes cap
				 ON desig_cap.capability_class_id = cap.id
				 WHERE desig_cap.designation_id = $1`,
				[designationId],
			);

			const capabilityClass = result.rows[0];

			if (!capabilityClass) return null;

			return new StaffCapabilityClass({
				id: capabilityClass.id,
				name: capabilityClass.name,
				category: capabilityClass.category,
				description: capabilityClass.description,
				createdAt: capabilityClass.created_at,
			});
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}
}

export default DesigCapClassRepositoryAdapter;
