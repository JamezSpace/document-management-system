import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import type { MediaRepositoryPort } from "../port/repos/MediaRepository.port.js";

class DeleteMediaUseCase {
	constructor(private readonly mediaRepo: MediaRepositoryPort) {}

	async deleteMedia(payload: {
		mediaId: string;
		hardDelete?: boolean;
	}) {
		const media = await this.mediaRepo.findMediaById(payload.mediaId);

		if (!media) {
			throw new ApplicationError(ApplicationErrorEnum.MEDIA_NOT_FOUND, {
				message: `Media with id ${payload.mediaId} doesn't exist.`,
				details: {
					mediaId: payload.mediaId,
				},
			});
		}

		if (payload.hardDelete) {
			await this.mediaRepo.hardDeleteMedia(payload.mediaId);
			return;
		}

		await this.mediaRepo.softDeleteMedia(payload.mediaId);
	}
}

export default DeleteMediaUseCase;
