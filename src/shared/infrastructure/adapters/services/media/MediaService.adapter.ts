import type {
	MediaServicePort,
	UploadedMediaMap,
} from "../../../../application/port/services/mediaService.port.js";

class MediaServiceAdapter implements MediaServicePort {
	private detectFormat(file: Buffer): string {
		if (
			file.length >= 8 &&
			file.subarray(0, 8).equals(
				Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
			)
		) {
			return "png";
		}

		if (
			file.length >= 3 &&
			file[0] === 0xff &&
			file[1] === 0xd8 &&
			file[2] === 0xff
		) {
			return "jpg";
		}

		if (file.length >= 6) {
			const signature = file.subarray(0, 6).toString("ascii");
			if (signature === "GIF87a" || signature === "GIF89a") return "gif";
		}

		if (
			file.length >= 12 &&
			file.subarray(0, 4).toString("ascii") === "RIFF" &&
			file.subarray(8, 12).toString("ascii") === "WEBP"
		) {
			return "webp";
		}

		if (
			file.length >= 5 &&
			file.subarray(0, 5).toString("ascii") === "%PDF-"
		) {
			return "pdf";
		}

		return "bin";
	}

    async uploadDoc(file: Buffer, ownerId: string): Promise<{ mediaId: string; }> {
        return {mediaId: '124r4'};
    }

    async uploadStaffMedia(staffId: string, mediaUploads: { signatureFile?: Buffer; profilePic?: Buffer; }): Promise<void> {
        return;
    }

	async uploadOnboardingMedia(
		sessionId: string,
		mediaUploads: { signatureFile?: Buffer; profilePic?: Buffer },
	): Promise<UploadedMediaMap> {
		const result: UploadedMediaMap = {};

		if (mediaUploads.profilePic) {
			result.profilePic = {
				storageProvider: "LOCAL",
				bucketName: "mock",
				objectKey: `onboarding/${sessionId}/profile_picture`,
				sizeBytes: mediaUploads.profilePic.length,
				format: this.detectFormat(mediaUploads.profilePic),
			};
		}

		if (mediaUploads.signatureFile) {
			result.signatureFile = {
				storageProvider: "LOCAL",
				bucketName: "mock",
				objectKey: `onboarding/${sessionId}/signature`,
				sizeBytes: mediaUploads.signatureFile.length,
				format: this.detectFormat(mediaUploads.signatureFile),
			};
		}

		return result;
	}

	resolveMediaToPublicURL(mediaDetailsFromDB: {
		objectKey: string | null;
		format: string | null;
	}): string | null {
		const { objectKey, format } = mediaDetailsFromDB;
		const publicBaseUrl = process.env.MEDIA_PUBLIC_BASE_URL;

		if (!publicBaseUrl || !objectKey || !format) return null;

		const normalizedBaseUrl = publicBaseUrl.replace(/\/+$/, "");
		const encodedObjectKey = objectKey
			.split("/")
			.map((segment) => encodeURIComponent(segment))
			.join("/");

		return `${normalizedBaseUrl}/${encodedObjectKey}.${encodeURIComponent(format)}`;
	}
}

export default MediaServiceAdapter;
