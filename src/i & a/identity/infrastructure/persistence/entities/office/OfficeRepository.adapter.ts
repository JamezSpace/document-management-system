import type { PostgresDb } from "@fastify/postgres";
import { Category } from "../../../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import { transformToCamelCase } from "../../../../../../shared/infrastructure/persistence/primary/helpers/transformToCamelCase.helper.js";
import type { OfficeRepositoryPort } from "../../../../application/ports/repos/entities/office/OfficeRepository.port.js";
import Office from "../../../../domain/entities/office/Office.js";

class OfficeRepositoryAdapter implements OfficeRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async fetchAllOffices(): Promise<Office[]> {
		const query = "SELECT * FROM identity.offices;";

		const result = await this.dbPool.query(query);

		let offices: any[] = [];
		result.rows.forEach((unit) => {
			const preparedOffice = transformToCamelCase(unit);

			offices.push(preparedOffice);
		});

		return offices;
	}

	async findOfficeById(id: string): Promise<Office | null> {
		const query = "SELECT * FROM identity.offices WHERE id = $1;";

		const result = await this.dbPool.query(query, [id]);

		return result.rows[0] || null;
	}

	async findOfficesByUnitId(unitId: string): Promise<Office[]> {
		const query = "SELECT * FROM identity.offices WHERE unit_id = $1;";

		const result = await this.dbPool.query(query, [unitId]);

		return result.rows || [];
	}

	async save(office: Office): Promise<Office> {
		try {
			const query = `
                INSERT INTO identity.offices (id, name, unit_id, created_at) 
                VALUES ($1, $2, $3, now())
                RETURNING id, name, unit_id, created_at`;

			const result = await this.dbPool.query(query, [
				office.getOfficeId(),
				office.name,
				office.unitId,
			]);

			const dbOffice = result.rows[0];

			return new Office({
				id: dbOffice.id,
				name: dbOffice.name,
				unitId: dbOffice.unit_id,
				createdAt: dbOffice.created_at,
			});
		} catch (error: any) {
			console.log("error in org unit repo adapter", error);

			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}
}

export default OfficeRepositoryAdapter;
