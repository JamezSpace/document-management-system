import type { PostgresDb } from "@fastify/postgres";
import type { DispatchStaffPort } from "../../../../../../shared/application/port/intersubsystem/DispatchStaff.port.js";
import {
    Category,
    GlobalInfrastructureErrors,
} from "../../../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../../../../shared/infrastructure/persistence/primary/postgres.js";

class DispatchStaffAdapter implements DispatchStaffPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async getStaffIdsByDesignationAndUnit(payload: {
		designationId: string;
		unitId: string;
	}): Promise<{ id: string }[]> {
		try {
			const query = `
				SELECT id
				FROM identity.staff
				WHERE designation_id = $1
					AND unit_id = $2
					AND status <> 'deleted';
			`;

			const result = await this.dbPool.query(query, [
				payload.designationId,
				payload.unitId,
			]);

			if (!result.rows || result.rows.length === 0) return [];

			return result.rows.map((row) => ({ id: row.id }));
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

	async getStaffDetailsById(
		staffId: string,
		tx?: TransactionContext,
	): Promise<{
        fullName: string;
		unitId: string;
        officeName: string;
        designationId: string;
	}> {
		try {
			const query = `
				SELECT full_name, designation_id, office_name, unit_id
				FROM identity.staff_details
				WHERE id = $1
				LIMIT 1;
			`;

			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, [staffId]);

			if (!result.rows || result.rows.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.NOT_FOUND,
					{
						category: Category.PERSISTENCE,
						message: `Staff ${staffId} not found.`,
					},
				);
			}

			return {
                fullName: result.rows[0].full_name,
				unitId: result.rows[0].unit_id,
				designationId: result.rows[0].designation_id,
				officeName: result.rows[0].office_name,
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

export default DispatchStaffAdapter;
