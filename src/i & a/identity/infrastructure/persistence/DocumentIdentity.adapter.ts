import type { PostgresDb } from "@fastify/postgres";
import type { DocumentIdentityPort } from "../../../../shared/application/port/intersubsystem/DocumentIdentity.port.js";
import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import { Category, GlobalInfrastructureErrors } from "../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";

class DocumentIdentityAdapter implements DocumentIdentityPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async resolveUnitHeadDesignation(
		recipientUnitId: string,
		tx?: TransactionContext,
	): Promise<{ id: string; title: string }> {
        try {
			const query = `
				SELECT id, title
				FROM identity.unit_head_designation
				WHERE unit_id = $1
				LIMIT 1;
			`;

			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, [recipientUnitId]);

			if (!result.rows || result.rows.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.NOT_FOUND,
					{
						category: Category.PERSISTENCE,
						message: `Unit head not found.`,
					},
				);
			}

			return {
                id: result.rows[0].id,
				title: result.rows[0].title
			};
		} catch (error: any) {
			if (error instanceof InfrastructureError) throw error;

			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
				table: postgresError.details?.table,
				column: postgresError.details?.column,
			});
		}
    }

    async getStaffByUid(uid: string): Promise<{ id: string } | null> {
        try {
			const query = `
				SELECT id 
				FROM identity.staff_details
				WHERE auth_provider_id = $1
				LIMIT 1;
			`;

			const result = await this.dbPool.query(query, [uid]);

			if (!result.rows || result.rows.length === 0) return null

			return {
                id: result.rows[0].id,
			};
		} catch (error: any) {
			if (error instanceof InfrastructureError) throw error;

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

export default DocumentIdentityAdapter;
