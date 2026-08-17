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

class DocumentMediaRepositoryAdapter
	implements DocumentMediaRepositoryPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	async save(payload: SaveDocumentMediaPayload): Promise<void> {
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

			await this.dbPool.query(query, [
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
}

export default DocumentMediaRepositoryAdapter;
