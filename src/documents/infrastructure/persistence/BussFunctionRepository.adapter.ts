import type { PostgresDb } from "@fastify/postgres";
import { Category, GlobalInfrastructureErrors } from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { BusinessFunctionRepositoryPort } from "../../application/ports/repos/BusinessFunctionRepository.port.js";
import type BusinessFunction from "../../domain/entities/businessFunction/BusinessFunction.js";
import BusinessFunctionEntity from "../../domain/entities/businessFunction/BusinessFunction.js";

class BusinessFunctionRepoAdapter
	implements BusinessFunctionRepositoryPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	private toDomain(row: any): BusinessFunction {
		return new BusinessFunctionEntity({
			id: row.id,
            subjectId: row.subject_id,
			code: row.code,
			name: row.name,
			description: row.description,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		});
	}

	async save(businessFunction: BusinessFunction): Promise<BusinessFunction> {
		try {
			const query = `
				INSERT INTO document.business_functions (id, code, name, description, created_at)
				VALUES ($1, $2, $3, $4, now())
				RETURNING *;
			`;

			const result = await this.dbPool.query(query, [
				businessFunction.getBusinessFunctionId(),
				businessFunction.code,
				businessFunction.name,
				businessFunction.description,
			]);

			return this.toDomain(result.rows[0]);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

            console.log(error)

			throw new InfrastructureError(
				postgresError.summary,
				{
					category: Category.PERSISTENCE,
					message: postgresError.details?.message ?? error.message,
					table: postgresError.details?.table,
					column: postgresError.details?.column,
				},
			);
		}
	}

	async findBusinessFunctionById(
		businessFunctionId: string,
	): Promise<BusinessFunction | null> {
		try {
			const query =
				"SELECT * FROM document.business_functions WHERE id = $1 LIMIT 1;";
			const result = await this.dbPool.query(query, [businessFunctionId]);

			if (!result.rows || result.rows.length === 0) return null;

			return this.toDomain(result.rows[0]);
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

	async fetchAll(): Promise<BusinessFunction[]> {
		try {
			const query = "SELECT * FROM document.business_functions;";
			const result = await this.dbPool.query(query);

			if (!result.rows || result.rows.length === 0) return [];

			return result.rows.map((row) => this.toDomain(row));
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

	async updateBusinessFunction(
		businessFunctionId: string,
		changesToMake: Partial<BusinessFunction>,
	): Promise<BusinessFunction> {
		try {
			const updates: string[] = [];
			const values: any[] = [];
			let paramCount = 1;

			if (changesToMake.code !== undefined) {
				updates.push(`code = $${paramCount++}`);
				values.push(changesToMake.code);
			}

			if (changesToMake.name !== undefined) {
				updates.push(`name = $${paramCount++}`);
				values.push(changesToMake.name);
			}

			if (changesToMake.description !== undefined) {
				updates.push(`description = $${paramCount++}`);
				values.push(changesToMake.description);
			}

			if (updates.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
					{
						category: Category.PERSISTENCE,
						message: "No valid business function fields to update.",
					},
				);
			}

			values.push(businessFunctionId);

			const query = `
				UPDATE document.business_functions
				SET ${updates.join(", ")}
				WHERE id = $${paramCount}
				RETURNING *;
			`;

			const result = await this.dbPool.query(query, values);

			if (!result.rows || result.rows.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.NOT_FOUND,
					{
						category: Category.PERSISTENCE,
						message: `Business function ${businessFunctionId} not found.`,
					},
				);
			}

			return this.toDomain(result.rows[0]);
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

export default BusinessFunctionRepoAdapter;
