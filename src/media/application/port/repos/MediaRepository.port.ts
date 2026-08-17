import type MediaAsset from "../../../domain/MediaAsset.js";

interface MediaRepositoryPort {
	save(mediaAsset: MediaAsset): Promise<MediaAsset>;

	findMediaById(id: string): Promise<MediaAsset | null>;

	replaceMedia(mediaAsset: MediaAsset): Promise<MediaAsset | null>;

	softDeleteMedia(id: string): Promise<void>;

	hardDeleteMedia(id: string): Promise<void>;
}

export type { MediaRepositoryPort };
