import { v2 as cloudinary } from "cloudinary";
import type { UploadApiOptions, UploadApiResponse } from "cloudinary";
import type {
	MediaServicePort,
	UploadedMediaMap,
} from "../../../../application/port/services/mediaService.port.js";

class CloudinaryMediaServiceAdapter implements MediaServicePort {
	constructor() {
		cloudinary.config({
			cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "",
			api_key: process.env.CLOUDINARY_API_KEY ?? "",
			api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
			secure: process.env.CLOUDINARY_SECURE !== "false",
		});
	}

	getCloudinaryDetails() {
		return {
			cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
		};
	}

	private uploadBuffer(
		buffer: Buffer,
		options: UploadApiOptions,
	): Promise<UploadApiResponse> {
		return new Promise((resolve, reject) => {
			const stream = cloudinary.uploader.upload_stream(
				options,
				(error, result) => {
					if (error || !result) {
						reject(error ?? new Error("Cloudinary upload failed"));
						return;
					}
					resolve(result);
				},
			);

			stream.end(buffer);
		});
	}

	async uploadDoc(
		file: Buffer,
		ownerId: string,
	): Promise<{ mediaId: string }> {
		const result = await this.uploadBuffer(file, {
			folder: "documents",
			resource_type: "auto",
			public_id: `doc_${ownerId}_${Date.now()}`,
		});

		return { mediaId: result.public_id };
	}

	async uploadStaffMedia(
		staffId: string,
		mediaUploads: { signatureFile?: Buffer; profilePic?: Buffer },
	): Promise<void> {
		const uploads: Promise<UploadApiResponse>[] = [];

		if (mediaUploads.profilePic) {
			uploads.push(
				this.uploadBuffer(mediaUploads.profilePic, {
					folder: `staff/${staffId}`,
					resource_type: "image",
					public_id: "profile_picture",
					overwrite: true,
				}),
			);
		}

		if (mediaUploads.signatureFile) {
			uploads.push(
				this.uploadBuffer(mediaUploads.signatureFile, {
					folder: `staff/${staffId}`,
					resource_type: "image",
					public_id: "signature",
					overwrite: true,
				}),
			);
		}

		if (uploads.length === 0) return;

		await Promise.all(uploads);
	}

	async uploadOnboardingMedia(
		sessionId: string,
		mediaUploads: { signatureFile?: Buffer; profilePic?: Buffer },
	): Promise<UploadedMediaMap> {
		const uploaded: UploadedMediaMap = {};

		if (mediaUploads.profilePic) {
			const result = await this.uploadBuffer(mediaUploads.profilePic, {
				folder: `onboarding/${sessionId}`,
				resource_type: "image",
				public_id: "profile_picture",
				overwrite: true,
			});

			uploaded.profilePic = {
				storageProvider: "cloudinary",
				bucketName: result.folder ?? null,
				objectKey: result.public_id,
				sizeBytes: result.bytes,
                format: result.format
			};
		}

		if (mediaUploads.signatureFile) {
			const result = await this.uploadBuffer(mediaUploads.signatureFile, {
				folder: `onboarding/${sessionId}`,
				resource_type: "image",
				public_id: "signature",
				overwrite: true,
			});

			uploaded.signatureFile = {
				storageProvider: "cloudinary",
				bucketName: result.folder ?? null,
				objectKey: result.public_id,
				sizeBytes: result.bytes,
                format: result.format
			};
		}

		return uploaded;
	}

	resolveMediaToPublicURL(mediaDetailsFromDB: {
		objectKey: string | null;
        format: string | null
	}): string | null {
		const { objectKey, format } = mediaDetailsFromDB;
		const cloudinaryConfig = this.getCloudinaryDetails();

		if (!objectKey || !format) return null;

		return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${objectKey}.${format}`;
	}

}

export default CloudinaryMediaServiceAdapter;
