// TODO: implement a global service for media assets uploadDoc
interface UploadedMediaStorageDetails {
	storageProvider: string;
	bucketName?: string | null;
	objectKey: string;
	sizeBytes?: number;
    format: string;
}

interface UploadedMediaMap {
	signatureFile?: UploadedMediaStorageDetails;
	profilePic?: UploadedMediaStorageDetails;
}

interface MediaServicePort {
	uploadDoc(file: Buffer, ownerId: string): Promise<{ mediaId: string }>;

	uploadStaffMedia(
		staffId: string,
		mediaUploads: {
			signatureFile?: Buffer;
			profilePic?: Buffer;
		},
	): Promise<void>;

	uploadOnboardingMedia(
		sessionId: string,
		mediaUploads: {
			signatureFile?: Buffer;
			profilePic?: Buffer;
		},
	): Promise<UploadedMediaMap>;

	resolveMediaToPublicURL(mediaDetailsFromDB: {
		objectKey: string | null;
        format: string | null;
	}): string | null;

}

export type { MediaServicePort, UploadedMediaMap, UploadedMediaStorageDetails };
