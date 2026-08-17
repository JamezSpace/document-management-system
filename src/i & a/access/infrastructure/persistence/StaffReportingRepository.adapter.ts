import type { PostgresDb } from "@fastify/postgres";
import InfrastructureError from "../../../../shared/errors/InfrastructureError.error.js";
import { Category } from "../../../../shared/errors/enum/infrastructure.enum.js";
import { mapPostgresError } from "../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import { transformToCamelCase } from "../../../../shared/infrastructure/persistence/primary/helpers/transformToCamelCase.helper.js";
import type { StaffReportingRepositoryPort } from "../../application/ports/StaffReportingRepository.port.js";
import StaffReporting from "../../domain/StaffReporting.js";

class StaffReportingRepositoryAdapter implements StaffReportingRepositoryPort {
    constructor(private readonly dbPool: PostgresDb){}

    private mapStaffReportingRow(row: any): StaffReporting {
		const reporting = transformToCamelCase(row);

		return new StaffReporting({
			id: reporting.id,
			staffId: reporting.staffId,
			supervisorId: reporting.supervisorId,
			type: reporting.type,
			delegatedBy: reporting.delegatedBy ?? null,
			effectiveFrom: reporting.effectiveFrom,
			effectiveTo: reporting.effectiveTo ?? null,
			createdAt: reporting.createdAt,
		});
	}
    
	async save(staffReporting: StaffReporting): Promise<StaffReporting> {
		try {
			const query = `
                    INSERT INTO identity.staff_reporting_lines (id, staff_id, supervisor_id, type, delegated_by, effective_from, effective_to, created_at) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING *`;

			const result = await this.dbPool.query(query, [
				staffReporting.id,
				staffReporting.staffId,
				staffReporting.supervisorId,
				staffReporting.type,
				staffReporting.delegatedBy ?? null,
				staffReporting.effectiveFrom,
				staffReporting.effectiveTo ?? null,
				staffReporting.createdAt,
			]);

			return this.mapStaffReportingRow(result.rows[0]);
		} catch (error: any) {
			console.log("error in staff reporting repo adapter", error);

			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}
}

export default StaffReportingRepositoryAdapter;
