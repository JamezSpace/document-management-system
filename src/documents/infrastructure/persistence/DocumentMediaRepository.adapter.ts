import type { PostgresDb } from "@fastify/postgres";
import {
    Category
} from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type {
    DocumentMediaRepositoryPort,
    SaveDocumentMediaPayload,
} from "../../application/ports/repos/DocumentMediaRepository.port.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";

class DocumentMediaRepositoryAdapter
	implements DocumentMediaRepositoryPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	async save(payload: SaveDocumentMediaPayload, tx?: TransactionContext): Promise<void> {
		try {
			const query = `
				INSERT INTO document.document_media_assets (
					document_id,
					document_version_id,
					media_id,
					asset_role,
					assigned_at
				)
				VALUES ($1,$2,$3,$4,$5)
				ON CONFLICT (document_id, media_id)
				DO UPDATE SET
					document_version_id = EXCLUDED.document_version_id,
					asset_role = EXCLUDED.asset_role,
					assigned_at = EXCLUDED.assigned_at
			`;

			const executor = tx?.client ?? this.dbPool;
			await executor.query(query, [
				payload.documentId,
				payload.documentVersionId ?? null,
				payload.mediaId,
				payload.assetRole,
				payload.assignedAt ?? new Date(),
			]);
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

	async mediaExistsForUploader(
		mediaId: string,
		uploadedBy: string,
		tx?: TransactionContext,
	): Promise<boolean> {
		const executor = tx?.client ?? this.dbPool;
		const result = await executor.query(
			`SELECT 1 FROM media.media_assets
			 WHERE id = $1 AND uploaded_by = $2 AND is_active = TRUE
			 LIMIT 1;`,
			[mediaId, uploadedBy],
		);
		return result.rows.length > 0;
	}

	async listByDocument(documentId: string) {
		const result = await this.dbPool.query(
			`SELECT dma.document_id, dma.document_version_id, dma.media_id,
			        dma.asset_role, dma.assigned_at, ma.mime_type,
			        ma.size_bytes, ma.checksum
			 FROM document.document_media_assets dma
			 JOIN media.media_assets ma ON ma.id = dma.media_id AND ma.is_active = TRUE
			 WHERE dma.document_id = $1
			 ORDER BY dma.assigned_at ASC;`,
			[documentId],
		);
		return result.rows.map((row) => ({
			documentId: row.document_id,
			documentVersionId: row.document_version_id,
			mediaId: row.media_id,
			assetRole: row.asset_role,
			assignedAt: row.assigned_at,
			mimeType: row.mime_type,
			sizeBytes: Number(row.size_bytes),
			checksum: row.checksum,
		}));
	}

	async remove(
		documentId: string,
		mediaId: string,
		tx?: TransactionContext,
	): Promise<boolean> {
		const executor = tx?.client ?? this.dbPool;
		const result = await executor.query(
			`DELETE FROM document.document_media_assets
			 WHERE document_id = $1 AND media_id = $2;`,
			[documentId, mediaId],
		);
		return (result.rowCount ?? 0) > 0;
	}
}

export default DocumentMediaRepositoryAdapter;
