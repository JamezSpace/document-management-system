import type { PostgresDb } from "@fastify/postgres";
import { Category } from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { MediaRepositoryPort } from "../../application/port/repos/MediaRepository.port.js";
import MediaAsset from "../../domain/MediaAsset.js";

class MediaAdapter implements MediaRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private toMediaAsset(row: any): MediaAsset {
		return new MediaAsset({
			id: row.id,
			assetRole: row.asset_role as any,
			mimeType: row.mime_type,
			size: Number(row.size_bytes),
			checksum: row.checksum,
			storageProvider: row.storage_provider,
			bucketName: row.bucket_name ?? "",
			objectKey: row.object_key,
			uploadedAt: row.uploaded_at,
			uploadedBy: row.uploaded_by,
			isActive: row.is_active,
		});
	}

	async save(mediaAsset: MediaAsset): Promise<MediaAsset> {
		try {
			const query = `
        INSERT INTO media.media_assets (
          id, asset_role, storage_provider, bucket_name, object_key, mime_type,
          size_bytes, checksum, uploaded_at, uploaded_by, is_active
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING *;
      `;

			const values = [
				mediaAsset.id,
				mediaAsset.assetRole as any,
				mediaAsset.storageProvider,
				mediaAsset.bucketName || null,
				mediaAsset.objectKey,
				mediaAsset.mimeType,
				mediaAsset.size,
				mediaAsset.checksum,
				mediaAsset.uploadedAt,
				mediaAsset.uploadedBy,
				mediaAsset.isActive,
			];

			const result = await this.dbPool.query(query, values);
			return this.toMediaAsset(result.rows[0]);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}

	async findMediaById(id: string): Promise<MediaAsset | null> {
		const query = "SELECT * FROM media.media_assets WHERE id = $1;";

		const result = await this.dbPool.query(query, [id]);
		if (!result.rows.length) return null;

		return this.toMediaAsset(result.rows[0]);
	}

	async replaceMedia(mediaAsset: MediaAsset): Promise<MediaAsset | null> {
		const query = `
      UPDATE media.media_assets
      SET
        asset_role = $2,
        storage_provider = $3,
        bucket_name = $4,
        object_key = $5,
        mime_type = $6,
        size_bytes = $7,
        checksum = $8,
        uploaded_at = $9,
        uploaded_by = $10,
        is_active = $11
      WHERE id = $1
      RETURNING *;
    `;

		const values = [
			mediaAsset.id,
			mediaAsset.assetRole as any,
			mediaAsset.storageProvider,
			mediaAsset.bucketName || null,
			mediaAsset.objectKey,
			mediaAsset.mimeType,
			mediaAsset.size,
			mediaAsset.checksum,
			mediaAsset.uploadedAt,
			mediaAsset.uploadedBy,
			mediaAsset.isActive,
		];

		const result = await this.dbPool.query(query, values);
		if (!result.rows.length) return null;

		return this.toMediaAsset(result.rows[0]);
	}

	async softDeleteMedia(id: string): Promise<void> {
		await this.dbPool.query(
			"UPDATE media.media_assets SET is_active = FALSE WHERE id = $1;",
			[id],
		);
	}

	async hardDeleteMedia(id: string): Promise<void> {
		await this.dbPool.query("DELETE FROM media.media_assets WHERE id = $1;", [
			id,
		]);
	}
}

export default MediaAdapter;
