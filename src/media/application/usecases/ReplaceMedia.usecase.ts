import type { IdGeneratorPort } from "../../../shared/application/port/services/IdGenerator.port.js";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import MediaAsset from "../../domain/MediaAsset.js";
import type { MediaEventsPort } from "../port/events/MediaEvents.port.js";
import type { MediaRepositoryPort } from "../port/repos/MediaRepository.port.js";
import type { MediaTypeForReplacement } from "../types/media.type.js";

class ReplaceMediaUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly mediaEvents: MediaEventsPort,
		private readonly mediaRepo: MediaRepositoryPort,
	) {}

	async replaceMedia(payload: MediaTypeForReplacement) {
		const oldMedia = await this.mediaRepo.findMediaById(payload.oldMediaId);

		if (!oldMedia)
			throw new ApplicationError(ApplicationErrorEnum.MEDIA_NOT_FOUND, {
				message: `Media with id ${payload.oldMediaId} doesn't exist.`,
				details: {
					mediaId: payload.oldMediaId,
				},
			});

		await this.mediaRepo.softDeleteMedia(payload.oldMediaId);

		const uuid = this.idGenerator.generate();
		const newMediaId = "MEDIA-" + uuid;

		const newMediaAsset = new MediaAsset({
			id: newMediaId,
			assetRole: payload.assetRole,
			mimeType: payload.mimeType,
			size: payload.size,
			checksum: payload.checksum,
			storageProvider: payload.storageProvider,
			bucketName: payload.bucketName,
			objectKey: payload.objectKey,
			uploadedAt: new Date(),
			uploadedBy: payload.replacedBy,
			isActive: true,
		});

		const createdMedia = await this.mediaRepo.save(newMediaAsset);

		if (createdMedia) {
			await this.mediaEvents.mediaReplaced({
				oldMediaId: payload.oldMediaId,
				newMediaId: createdMedia.id,
				replacedBy: payload.replacedBy,
			});
		}

		return createdMedia;
	}
}

export default ReplaceMediaUseCase;
