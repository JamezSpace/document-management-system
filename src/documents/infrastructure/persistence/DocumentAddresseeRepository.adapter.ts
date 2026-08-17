import type { PostgresDb } from "@fastify/postgres";
import {
    Category,
    GlobalInfrastructureErrors,
} from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type { DocumentAddresseeRepositoryPort } from "../../application/ports/repos/DocumentAddresseeRepository.port.js";
import type DocumentAddressee from "../../domain/valueobjects/DocumentAddressee.js";
import type { DocumentAddresseePayload } from "../../domain/valueobjects/DocumentAddressee.js";
import DocumentAddresseeEntity from "../../domain/valueobjects/DocumentAddressee.js";

class DocumentAddresseeRepositoryAdapter
	implements DocumentAddresseeRepositoryPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	private toDomain(row: any): DocumentAddressee {
		return new DocumentAddresseeEntity({
			documentId: row.document_id,
			recipientUnitId: row.recipient_unit_id,
			addressedToDesignationId: row.addressed_to_designation_id,
            isPrimary: row.is_primary
		});
	}

	async save(
		payload: DocumentAddresseePayload,
		tx?: TransactionContext,
	): Promise<DocumentAddressee> {
		try {
			const query = `
				INSERT INTO document.document_addressee (
					document_id,
					recipient_unit_id,
					addressed_to_designation_id,
                    is_primary
				)
				VALUES ($1, $2, $3, $4)
				ON CONFLICT (
					document_id,
					recipient_unit_id,
					addressed_to_designation_id 
				)
				DO UPDATE SET
                    is_primary = EXCLUDED.is_primary
				RETURNING *;
			`;
            
			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, [
				payload.documentId,
				payload.recipientUnitId,
				payload.addressedToDesignationId,
                payload.isPrimary
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

	async fetchAll(): Promise<DocumentAddressee[]> {
		try {
			const query = `
				SELECT *
				FROM document.document_addressee
				ORDER BY document_id, recipient_unit_id, addressed_to_designation_id;
			`;

			const result = await this.dbPool.query(query);

			if (!result.rows || result.rows.length === 0) return [];

			return result.rows.map((row) => this.toDomain(row));
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

	async editDocAddressee(
		payload: {
			documentId: string;
			editsToMake: Omit<
				DocumentAddresseePayload,
				"documentId" | "recipientUnitId"
			>;
		},
		tx?: TransactionContext,
	): Promise<DocumentAddressee | null> {
		try {
			const query = `
				UPDATE document.document_addressee
				SET addressed_to_designation_id = $2
				WHERE document_id = $1
				RETURNING *;
			`;

			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, [
				payload.documentId,
				payload.editsToMake.addressedToDesignationId,
			]);

			if (!result.rows || result.rows.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.NOT_FOUND,
					{
						category: Category.PERSISTENCE,
						message: `Document addressee for ${payload.documentId} not found.`,
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

	async deleteByDocumentId(
		documentId: string,
		tx?: TransactionContext,
	): Promise<void> {
		try {
			const query = "DELETE FROM document.document_addressee WHERE document_id = $1;";
			const executor = tx?.client ?? this.dbPool;
			await executor.query(query, [documentId]);
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
}

export default DocumentAddresseeRepositoryAdapter;
