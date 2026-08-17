import type { PostgresDb } from "@fastify/postgres";
import { Category, GlobalInfrastructureErrors } from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type { DocumentVersionRepositoryPort } from "../../application/ports/repos/DocumentVersionRepository.port.js";
import DocumentVersion from "../../domain/entities/document/DocumentVersion.js";
import { LifecycleState } from "../../domain/enum/lifecycleState.enum.js";

class DocVersionRepositoryAdapter implements DocumentVersionRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private toDomain(row: any): DocumentVersion {
		return new DocumentVersion({
			id: row.id,
			documentId: row.document_id,
            contentDelta: row.content_delta,
			versionNumber: row.version_number,
			mediaId: row.media_id,
			createdAt: row.created_at,
			createdBy: row.created_by,
			lifecycle: {
				currentState: row.lifecycle_state,
				stateEnteredAt: row.state_entered_at,
				stateEnteredBy: row.state_entered_by,
			},
		});
	}

	async save(document: DocumentVersion, tx?: TransactionContext): Promise<DocumentVersion> {
		try {
			const query = `
				INSERT INTO document.document_versions (
					id, document_id, content_delta, version_number, media_id, created_at, created_by, lifecycle_state,
					state_entered_at, state_entered_by
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
				RETURNING *;
			`;

            const executor = tx?.client ?? this.dbPool;

			const result = await executor.query(query, [
				document.id,
				document.documentId,
                document.contentDelta,
				document.versionNumber,
				document.mediaId,
				document.createdAt,
				document.createdBy,
				document.lifecycle.currentState,
				document.lifecycle.stateEnteredAt,
				document.lifecycle.stateEnteredBy,
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

	async findVersionedDocumentById(id: string): Promise<DocumentVersion | null> {
		try {
			const query = "SELECT * FROM document.document_versions WHERE id = $1 LIMIT 1;";
			const result = await this.dbPool.query(query, [id]);

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

	async editVersionedDocument(
		document: DocumentVersion,
        tx?: TransactionContext
	): Promise<DocumentVersion | null> {
		try {
			const query = `
				UPDATE document.document_versions
				SET
					document_id = $2,
                    content_delta = $3,
					version_number = $4,
					media_id = $5,
					lifecycle_state = $6,
					state_entered_at = $7,
					state_entered_by = $8
				WHERE id = $1
				RETURNING *;
			`;

            const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, [
				document.id,
				document.documentId,
                document.contentDelta,
				document.versionNumber,
				document.mediaId,
				document.lifecycle.currentState,
				document.lifecycle.stateEnteredAt,
				document.lifecycle.stateEnteredBy,
			]);

			if (!result.rows || result.rows.length === 0) return null;

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

	async softDeleteDocument(id: string): Promise<void> {
		await this.dbPool.query(
			"UPDATE document.document_versions SET lifecycle_state = $2 WHERE id = $1;",
			[id, LifecycleState.CANCELLED],
		);
	}

	async hardDeleteDocument(id: string): Promise<void> {
		await this.dbPool.query(
			"DELETE FROM document.document_versions WHERE id = $1;",
			[id],
		);
	}
}

export default DocVersionRepositoryAdapter;
