type UploadedByType = "staff" | "onboarding_session" | "system";

interface CreateMediaAssetPayload {
	id: string;
	storageProvider: string;
	bucketName?: string | null;
	objectKey: string;
	format: string;
	mimeType: string;
	sizeBytes: number;
	checksum: string;
	uploadedAt?: Date;
	uploadedBy: string;
	uploadedByType: UploadedByType;
}

interface MediaAssetRecord {
	id: string;
	storageProvider: string;
	bucketName: string | null;
	objectKey: string;
	format: string;
	mimeType: string;
	sizeBytes: number;
	checksum: string;
	uploadedAt: Date;
	uploadedBy: string;
	uploadedByType: UploadedByType;
}

export type { CreateMediaAssetPayload, MediaAssetRecord, UploadedByType };
