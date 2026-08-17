import type { IdGeneratorPort } from "../../../shared/application/port/services/IdGenerator.port.js";
import MediaAsset from "../../domain/MediaAsset.js";
import type { MediaEventsPort } from "../port/events/MediaEvents.port.js";
import type { MediaRepositoryPort } from "../port/repos/MediaRepository.port.js";
import type { MediaTypeForCreation } from "../types/media.type.js";

class UploadMediaUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly mediaEvents: MediaEventsPort,
		private readonly mediaRepo: MediaRepositoryPort,
	) {}

	async uploadMedia(payload: MediaTypeForCreation) {
		const uuid = this.idGenerator.generate();
		const mediaId = "MEDIA-" + uuid;

		const mediaAsset = new MediaAsset({
			id: mediaId,
			assetRole: payload.assetRole,
			mimeType: payload.mimeType,
			size: payload.size,
			checksum: payload.checksum,
			storageProvider: payload.storageProvider,
			bucketName: payload.bucketName,
			objectKey: payload.objectKey,
			uploadedAt: new Date(),
			uploadedBy: payload.uploadedBy,
			isActive: true,
		});

		const media = await this.mediaRepo.save(mediaAsset);

		if (media) {
			await this.mediaEvents.mediaAdded({
				mediaId: media.id,
				uploadedBy: media.uploadedBy,
			});
		}

		return media;
	}
}

export default UploadMediaUseCase;
