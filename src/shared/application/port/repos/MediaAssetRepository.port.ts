import type {
	CreateMediaAssetPayload,
	MediaAssetRecord,
} from "../../types/mediaAsset.type.js";

interface MediaAssetRepositoryPort {
	save(payload: CreateMediaAssetPayload): Promise<MediaAssetRecord>;

	findById(mediaId: string): Promise<MediaAssetRecord | null>;
}

export type { MediaAssetRepositoryPort };
