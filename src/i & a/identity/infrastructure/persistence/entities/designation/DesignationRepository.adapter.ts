import type { PostgresDb } from "@fastify/postgres";
import InfrastructureError from "../../../../../../shared/errors/InfrastructureError.error.js";
import { Category } from "../../../../../../shared/errors/enum/infrastructure.enum.js";
import { mapPostgresError } from "../../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { DesignationRepositoryPort } from "../../../../application/ports/repos/entities/designation/DesignationRepository.port.js";
import Designation from "../../../../domain/entities/office/Designation.js";

class DesignationRepositoryAdapter implements DesignationRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private toDomain(row: any) {
		return new Designation({
			id: row.id,
			officeId: row.office_id,
			title: row.title,
			description: row.description,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		});
	}

	async save(designation: Designation): Promise<Designation> {
		try {
			const result = await this.dbPool.query(
				"INSERT INTO identity.designations VALUES ($1, $2, $3, $4, $5) RETURNING *",
				[
					designation.getDesignationId(),
					designation.title,
					designation.description,
					designation.officeId,
					designation.createdAt,
				],
			);

			const dbDesignation = result.rows[0];

			return this.toDomain(dbDesignation);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}

	async findDesignationById(
		id: string,
		tx?: TransactionContext,
	): Promise<Designation | null> {
		const executor = tx?.client ?? this.dbPool;

		const result = await executor.query(
			"SELECT * FROM identity.designations WHERE id = $1",
			[id],
		);

		const dbDesignation = result.rows[0];

		if (!dbDesignation) return null;

		return this.toDomain(dbDesignation);
	}

	async fetchAll(): Promise<Designation[]> {
		const result = await this.dbPool.query(
			"SELECT * FROM identity.designations ORDER BY office_id;",
		);

		return result.rows.map((designation) => this.toDomain(designation));
	}

	async fetchAllDesignationsWithinAnOffice(officeId: string): Promise<{
		officeName: string;
		designations: Designation[];
	}> {
		const result = await this.dbPool.query(
			`SELECT desig.*, office.name as office_name
            FROM identity.designations desig
            JOIN identity.offices office
            ON desig.office_id = office.id
            WHERE office_id = $1;`,
			[officeId],
		);

		const designations: Designation[] = [];
		let officeName: string = "";

		result.rows.forEach((desig) => {
			officeName = desig.office_name;
			const { office_name, ...designationData } = desig;

			designations.push(this.toDomain(desig))
		});

		return {
			officeName,
			designations,
		};
	}
}

export default DesignationRepositoryAdapter;
