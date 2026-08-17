import type { MediaRole } from "../../domain/enum/role.enum.js";

interface MediaTypeForCreation {
	assetRole: MediaRole;
	mimeType: string;
	size: number;
	checksum: string;
	storageProvider: string;
	bucketName: string;
	objectKey: string;
	uploadedBy: string;
}

interface MediaTypeForReplacement {
	oldMediaId: string;
	assetRole: MediaRole;
	mimeType: string;
	size: number;
	checksum: string;
	storageProvider: string;
	bucketName: string;
	objectKey: string;
	replacedBy: string;
}

export type { MediaTypeForCreation, MediaTypeForReplacement };
