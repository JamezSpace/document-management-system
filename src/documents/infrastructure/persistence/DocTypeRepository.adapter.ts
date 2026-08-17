import type { PostgresDb } from "@fastify/postgres";
import {
    Category,
    GlobalInfrastructureErrors,
} from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type { DocumentTypeRepositoryPort } from "../../application/ports/repos/DocumentTypeRepo.port.js";
import type DocumentType from "../../domain/entities/documentType/DocumentType.js";
import DocumentTypeEntity from "../../domain/entities/documentType/DocumentType.js";

class DocTypeRepoAdapter implements DocumentTypeRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private toDomain(row: any): DocumentType {
		return new DocumentTypeEntity({
			id: row.id,
			code: row.code,
			name: row.name,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		});
	}

	async save(type: DocumentType): Promise<DocumentType> {
		try {
			const query = `
				INSERT INTO document.document_type (id, code, name, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5)
				RETURNING *;
			`;

			const result = await this.dbPool.query(query, [
				type.id,
				type.code,
				type.name,
				type.createdAt,
				type.updatedAt,
			]);

			return this.toDomain(result.rows[0]);
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

	async fetchAll(): Promise<DocumentType[]> {
		try {
			const query = "SELECT * FROM document.document_type;";
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

	async findDocumentTypeById(
		typeId: string,
		tx?: TransactionContext,
	): Promise<DocumentType | null> {
		try {
			const query =
				"SELECT * FROM document.document_type WHERE id = $1 LIMIT 1;";

			const executor = tx?.client ?? this.dbPool;

			const result = await executor.query(query, [typeId]);

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
}

export default DocTypeRepoAdapter;
