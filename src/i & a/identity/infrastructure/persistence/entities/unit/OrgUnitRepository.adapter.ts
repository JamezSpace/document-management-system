import type { PostgresDb } from "@fastify/postgres";
import InfrastructureError from "../../../../../../shared/errors/InfrastructureError.error.js";
import { Category } from "../../../../../../shared/errors/enum/infrastructure.enum.js";
import { mapPostgresError } from "../../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import { transformToCamelCase } from "../../../../../../shared/infrastructure/persistence/primary/helpers/transformToCamelCase.helper.js";
import type { OrgUnitRepositoryPort } from "../../../../application/ports/repos/entities/unit/OrgUnitRepository.port.js";
import type OrganizationalUnit from "../../../../domain/entities/unit/OrganizationalUnit.js";

class OrgUnitRepositoryAdapter implements OrgUnitRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async save(orgUnit: OrganizationalUnit): Promise<OrganizationalUnit> {
		try {
			const query = `
                INSERT INTO identity.organizational_units (id, code, full_name, description, sector, parent_id, created_at) 
                VALUES ($1, $2, $3, $4, $5, $6, now())
                RETURNING id, code, full_name, description, sector, parent_id, created_at`;

			const result = await this.dbPool.query(query, [
				orgUnit.id,
				orgUnit.code,
				orgUnit.fullName,
				orgUnit.description,
				orgUnit.sector,
				orgUnit.parentId,
			]);

			return result.rows[0];
		} catch (error: any) {
			console.log("error in org unit repo adapter", error);

			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}

	async findOrgUnitById(id: string): Promise<OrganizationalUnit | null> {
		const query = "SELECT * FROM org_units WHERE id = $1;";
		const result = await this.dbPool.query(query, [id]);
		return result.rows[0] || null;
	}

	async findAllUnitsBySector(sector: string): Promise<OrganizationalUnit[]> {
		const query = "SELECT * FROM org_units WHERE sector = $1;";

		const result = await this.dbPool.query(query, [sector]);

		return result.rows;
	}

	async fetchAllUnits(): Promise<OrganizationalUnit[]> {
		const query = "SELECT * FROM identity.organizational_units;";

		const result = await this.dbPool.query(query);

		let units: OrganizationalUnit[] = [];
		result.rows.forEach((unit) => {
			const preparedUnit = transformToCamelCase(unit);

			units.push(preparedUnit as OrganizationalUnit);
		});

		return units;
	}
}

export default OrgUnitRepositoryAdapter;
