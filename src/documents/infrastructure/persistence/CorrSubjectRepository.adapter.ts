import type { PostgresDb } from "@fastify/postgres";
import { Category, GlobalInfrastructureErrors } from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { CorrespondenceSubjectRepositoryPort } from "../../application/ports/repos/CorrespondenceRepository.port.js";
import type CorrespondenceSubject from "../../domain/entities/correspondenceSubject/CorrespondenceSubject.js";
import CorrespondenceSubjectEntity from "../../domain/entities/correspondenceSubject/CorrespondenceSubject.js";

class CorrespondenceSubjectRepoAdapter implements CorrespondenceSubjectRepositoryPort {
    constructor(private readonly dbPool: PostgresDb) {}

	private toDomain(row: any): CorrespondenceSubject {
		return new CorrespondenceSubjectEntity({
			id: row.id,
			code: row.code,
			name: row.name,
			description: row.description,
			createdAt: row.created_at,
			uploadedAt: row.uploaded_at,
		});
	}
    
	async save(
		correspondenceSubject: CorrespondenceSubject,
	): Promise<CorrespondenceSubject> {
		try {
			const query = `
				INSERT INTO document.correspondence_subjects
					(id, code, name, description, created_at, uploaded_at)
				VALUES ($1, $2, $3, $4, $5, $6)
				RETURNING *;
			`;

			const result = await this.dbPool.query(query, [
				correspondenceSubject.getCorrespondenceSubjectId(),
				correspondenceSubject.code,
				correspondenceSubject.name,
				correspondenceSubject.description,
				correspondenceSubject.createdAt,
				correspondenceSubject.uploadedAt,
			]);

			return this.toDomain(result.rows[0]);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

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

	async findCorrespondenceSubjectById(
		correspondenceSubjectId: string,
	): Promise<CorrespondenceSubject | null> {
		try {
			const query =
				"SELECT * FROM document.correspondence_subjects WHERE id = $1;";
			const result = await this.dbPool.query(query, [
				correspondenceSubjectId,
			]);

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

	async fetchAll(): Promise<CorrespondenceSubject[]> {
		try {
			const query = "SELECT * FROM document.correspondence_subjects;";
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

	async updateCorrespondenceSubject(
		correspondenceSubjectId: string,
		changesToMake: Partial<CorrespondenceSubject>,
	): Promise<CorrespondenceSubject> {
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

			if (changesToMake.uploadedAt !== undefined) {
				updates.push(`uploaded_at = $${paramCount++}`);
				values.push(changesToMake.uploadedAt);
			}

			if (updates.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
					{
						category: Category.PERSISTENCE,
						message: "No valid correspondence subject fields to update.",
					},
				);
			}

			values.push(correspondenceSubjectId);

			const query = `
				UPDATE document.correspondence_subjects
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
						message: `Correspondence subject ${correspondenceSubjectId} not found.`,
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

export default CorrespondenceSubjectRepoAdapter;
