import type { PostgresDb } from "@fastify/postgres";
import type { MediaAssetRepositoryPort } from "../../../application/port/repos/MediaAssetRepository.port.js";
import type {
    CreateMediaAssetPayload,
    MediaAssetRecord,
    UploadedByType,
} from "../../../application/types/mediaAsset.type.js";
import {
    Category,
    GlobalInfrastructureErrors,
} from "../../../errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../errors/InfrastructureError.error.js";
import { mapPostgresError } from "./helpers/mapPostgresError.helper.js";

class MediaAssetRepositoryAdapter implements MediaAssetRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private toMediaAssetRecord(row: any): MediaAssetRecord {
		return {
			id: row.id,
			storageProvider: row.storage_provider,
			bucketName: row.bucket_name,
			objectKey: row.object_key,
            format: row.format,
			mimeType: row.mime_type,
			sizeBytes: Number(row.size_bytes),
			checksum: row.checksum,
			uploadedAt: row.uploaded_at,
			uploadedBy: row.uploaded_by,
			uploadedByType: row.uploaded_by_type as UploadedByType,
		};
	}

	async save(payload: CreateMediaAssetPayload): Promise<MediaAssetRecord> {
		try {
			const query = `
				INSERT INTO media.media_assets (
					id,
					storage_provider,
					bucket_name,
					object_key,
                    format,
					mime_type,
					size_bytes,
					checksum,
					uploaded_at,
					uploaded_by,
					uploaded_by_type
				)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
				RETURNING id, storage_provider, bucket_name, object_key, format, mime_type, size_bytes, checksum, uploaded_at, uploaded_by, uploaded_by_type
			`;

			const result = await this.dbPool.query(query, [
				payload.id,
				payload.storageProvider,
				payload.bucketName ?? null,
				payload.objectKey,
				payload.format,
				payload.mimeType,
				payload.sizeBytes,
				payload.checksum,
				payload.uploadedAt ?? new Date(),
				payload.uploadedBy,
				payload.uploadedByType,
			]);

			return this.toMediaAssetRecord(result.rows[0]);
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

	async findById(mediaId: string): Promise<MediaAssetRecord | null> {
		try {
			const query = `
				SELECT id, storage_provider, bucket_name, object_key, format, mime_type, size_bytes, checksum, uploaded_at, uploaded_by, uploaded_by_type
				FROM media.media_assets
				WHERE id = $1
				LIMIT 1
			`;

			const result = await this.dbPool.query(query, [mediaId]);

			if (!result.rows || result.rows.length === 0) return null;

			return this.toMediaAssetRecord(result.rows[0]);
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

export default MediaAssetRepositoryAdapter;
