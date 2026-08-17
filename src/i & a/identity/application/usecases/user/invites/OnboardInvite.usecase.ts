import { createHash } from "node:crypto";
import type { MediaAssetRepositoryPort } from "../../../../../../shared/application/port/repos/MediaAssetRepository.port.js";
import type { IdGeneratorPort } from "../../../../../../shared/application/port/services/IdGenerator.port.js";
import type { MediaServicePort, UploadedMediaMap } from "../../../../../../shared/application/port/services/mediaService.port.js";
import ApplicationError from "../../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../../shared/errors/enum/application.enum.js";
import type Invite from "../../../../domain/entities/user/Invite.js";
import OnboardingSession from "../../../../domain/entities/user/OnboardingSession.js";
import { OnboardingSessionStatus } from "../../../../domain/enum/onboardingSessionStatus.enum.js";
import { InviteStatus } from "../../../../domain/enum/staff.enum.js";
import type { InviteRepositoryPort } from "../../../ports/repos/entities/user/InviteRepository.port.js";
import type { OnboardingSessionRepositoryPort } from "../../../ports/repos/entities/user/OnboardingSessionRepository.port.js";
import type { TokenServicePort } from "../../../ports/services/TokenService.port.js";
import type { OnboardingSessionInit } from "../../../types/user/onboardingSession.type.js";

type UpdatableInviteField = Exclude<keyof Invite, "id" | "createdAt">;

class OnboardingInviteUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly tokenService: TokenServicePort,
		private readonly mediaService: MediaServicePort,
		private readonly mediaAssetRepo: MediaAssetRepositoryPort,
		private readonly inviteRepo: InviteRepositoryPort,
		private readonly onboardingSessionRepo: OnboardingSessionRepositoryPort,
	) {}

	async resolveMediaAssetsToURL(session: OnboardingSession) {
		let profilePicPublicURL: string | null = null;
		let signaturePublicURL: string | null = null;

		if (session.profilePictureMediaId) {
			const profilePicMediaDetails = await this.mediaAssetRepo.findById(
				session.profilePictureMediaId,
			);

			if (!profilePicMediaDetails) {
				profilePicPublicURL = null;
			} else {
				profilePicPublicURL = this.mediaService.resolveMediaToPublicURL(
					{
						objectKey: profilePicMediaDetails.objectKey,
						format: profilePicMediaDetails.format,
					},
				);
			}
		}

		if (session.signatureMediaId) {
			const signatureMediaDetails = await this.mediaAssetRepo.findById(
				session.signatureMediaId,
			);

			if (!signatureMediaDetails) {
				signaturePublicURL = null;
			} else {
				signaturePublicURL = this.mediaService.resolveMediaToPublicURL({
					objectKey: signatureMediaDetails.objectKey,
					format: signatureMediaDetails.format,
				});
			}
		}

		return { profilePicPublicURL, signaturePublicURL };
	}

	async resolveUploadedMediaToURL(uploadedMedia: UploadedMediaMap) {
		const profilePicPublicURL = uploadedMedia.profilePic
			? this.mediaService.resolveMediaToPublicURL({
					objectKey: uploadedMedia.profilePic.objectKey,
					format: uploadedMedia.profilePic.format,
				})
			: null;

		const signaturePublicURL = uploadedMedia.signatureFile
			? this.mediaService.resolveMediaToPublicURL({
					objectKey: uploadedMedia.signatureFile.objectKey,
					format: uploadedMedia.signatureFile.format,
				})
			: null;

		return { profilePicPublicURL, signaturePublicURL };
	}

	async getInvite(token: string) {
		const isTokenValid = this.tokenService.validateToken(token);

		if (!isTokenValid)
			throw new ApplicationError(
				ApplicationErrorEnum.INVALID_CREDENTIALS,
				{
					message:
						"The provided token is not a valid security string.",
				},
			);

		const invite = await this.inviteRepo.findByToken(token);

		return invite;
	}

	async initOnboardingSession(payload: OnboardingSessionInit) {
        const existing = await this.onboardingSessionRepo.findSessionByInviteId(payload.inviteId);

        if (existing) return existing;

        const newSession = new OnboardingSession({
			id: "ONBRD-SESS-" + this.idGenerator.generate(),
			inviteId: payload.inviteId,
			currentStep: 1,
			email: payload.email,
			startedAt: new Date(),
			status: OnboardingSessionStatus.IN_PROGRESS,
		});

		const savedSession = await this.onboardingSessionRepo.save(newSession);

		return savedSession;
	}

	async getOnboardingSessionByInviteId(inviteId: string) {
		const session =
			await this.onboardingSessionRepo.findSessionByInviteId(inviteId);

		if (!session) return null;

		const { profilePicPublicURL, signaturePublicURL } =
			await this.resolveMediaAssetsToURL(session);

		const {
			profilePictureMediaId,
			signatureMediaId,
			...restOfSessionData
		} = session;

		return {
			profilePicPublicURL,
			signaturePublicURL,
			...restOfSessionData,
		};
	}

	async getAllOnboardingSessions() {
		const sessions = await this.onboardingSessionRepo.fetchAll();

		return sessions.map((session) => {
			const {
				profilePictureBucketName,
				profilePictureObjectKey,
				profilePictureFormat,
				signatureBucketName,
				signatureObjectKey,
				signatureFormat,
				...restOfSessionData
			} = session;

			return {
				profilePicPublicURL: this.mediaService.resolveMediaToPublicURL({
					objectKey: profilePictureObjectKey,
					format: profilePictureFormat,
				}),
				signaturePublicURL: this.mediaService.resolveMediaToPublicURL({
					objectKey: signatureObjectKey,
					format: signatureFormat,
				}),
				...restOfSessionData,
			};
		});
	}

	async updateInviteField(
		inviteId: string,
		fieldToUpdate: UpdatableInviteField,
		valueToInsert: Invite[UpdatableInviteField],
	) {
		const updatedInvite = await this.inviteRepo.update(inviteId, {
			[fieldToUpdate]: valueToInsert,
			updatedAt: new Date(),
		} as Partial<Invite>);

		return updatedInvite;
	}

	async updateOnboardingSession(
		sessionId: string,
		payload: {
			primaryData: {
				firstName: string;
				lastName: string;
				middleName: string;
				email: string;
				phoneNumber: string;
				staffId: number;
			};
			currentStep: number;
		},
	) {
		const updatedSession = await this.onboardingSessionRepo.update(
			sessionId,
			{
				primaryData: payload.primaryData,
				currentStep: payload.currentStep,
				lastActiveAt: new Date(),
			},
		);

		const { profilePicPublicURL, signaturePublicURL } =
			await this.resolveMediaAssetsToURL(updatedSession);

		const {
			profilePictureMediaId,
			signatureMediaId,
			...restOfSessionData
		} = updatedSession;

		return {
			profilePicPublicURL,
			signaturePublicURL,
			...restOfSessionData,
		};
	}

	async completeOnboardingSession(inviteId: string, sessionId: string) {
		const timeCompleted = new Date();

		const completedSession = await this.onboardingSessionRepo.update(
			sessionId,
			{
				completedAt: timeCompleted,
				status: OnboardingSessionStatus.COMPLETED,
			},
		);

		// update invite status
		await this.inviteRepo.update(inviteId, {
			status: InviteStatus.ACCEPTED,
			acceptedAt: timeCompleted,
			isUsed: true,
		});

		const { profilePicPublicURL, signaturePublicURL } =
			await this.resolveMediaAssetsToURL(completedSession);

		const {
			profilePictureMediaId,
			signatureMediaId,
			...restOfSessionData
		} = completedSession;

		return {
			profilePicPublicURL,
			signaturePublicURL,
			...restOfSessionData,
		};
	}

	async uploadOnboardingMedia(
		sessionId: string,
		payload: {
			profilePic?: { buffer: Buffer; mimeType?: string };
			signatureFile?: { buffer: Buffer; mimeType?: string };
			currentStep: number;
		},
	) {
		if (!payload.profilePic && !payload.signatureFile) {
			throw new ApplicationError(
				ApplicationErrorEnum.INCOMPLETE_REQUEST,
				{
					message: "At least one media file must be provided.",
				},
			);
		}

		const session =
			await this.onboardingSessionRepo.findSessionById(sessionId);
		if (!session) {
			throw new ApplicationError(ApplicationErrorEnum.INVITE_NOT_FOUND, {
				message: `Onboarding session ${sessionId} not found.`,
			});
		}

		const uploadedMedia = await this.mediaService.uploadOnboardingMedia(
			sessionId,
			{
				...(payload.profilePic
					? { profilePic: payload.profilePic.buffer }
					: {}),
				...(payload.signatureFile
					? { signatureFile: payload.signatureFile.buffer }
					: {}),
			},
		);

		let ppMediaId: string | undefined;
		let sMediaId: string | undefined;

		if (uploadedMedia.profilePic && payload.profilePic) {
			ppMediaId = "MEDIA-" + this.idGenerator.generate();

			await this.mediaAssetRepo.save({
				id: ppMediaId,
				storageProvider: uploadedMedia.profilePic.storageProvider,
				bucketName: uploadedMedia.profilePic.bucketName ?? null,
				objectKey: uploadedMedia.profilePic.objectKey,
				format: uploadedMedia.profilePic.format,
				mimeType:
					payload.profilePic.mimeType ?? "application/octet-stream",
				sizeBytes:
					uploadedMedia.profilePic.sizeBytes ??
					payload.profilePic.buffer.length,
				checksum: createHash("sha256")
					.update(payload.profilePic.buffer)
					.digest("hex"),
				uploadedBy: sessionId,
				uploadedByType: "onboarding_session",
				uploadedAt: new Date(),
			});
		}

		if (uploadedMedia.signatureFile && payload.signatureFile) {
			sMediaId = "MEDIA-" + this.idGenerator.generate();

			await this.mediaAssetRepo.save({
				id: sMediaId,
				storageProvider: uploadedMedia.signatureFile.storageProvider,
				bucketName: uploadedMedia.signatureFile.bucketName ?? null,
				objectKey: uploadedMedia.signatureFile.objectKey,
				format: uploadedMedia.signatureFile.format,
				mimeType:
					payload.signatureFile.mimeType ??
					"application/octet-stream",
				sizeBytes:
					uploadedMedia.signatureFile.sizeBytes ??
					payload.signatureFile.buffer.length,
				checksum: createHash("sha256")
					.update(payload.signatureFile.buffer)
					.digest("hex"),
				uploadedBy: sessionId,
				uploadedByType: "onboarding_session",
				uploadedAt: new Date(),
			});
		}

		await this.onboardingSessionRepo.assignOnboardingSessionMedia(sessionId, {
			...(ppMediaId ? { profilePictureMediaId: ppMediaId } : {}),
			...(sMediaId ? { signatureMediaId: sMediaId } : {}),
		});

		const updatedSession = await this.onboardingSessionRepo.update(
			sessionId,
			{
				currentStep: payload.currentStep,
				lastActiveAt: new Date(),
			},
		);

		const { profilePicPublicURL, signaturePublicURL } =
			await this.resolveMediaAssetsToURL(updatedSession);

		const {
			profilePictureMediaId,
			signatureMediaId,
			...restOfSessionData
		} = updatedSession;

		return {
			profilePicPublicURL,
			signaturePublicURL,
			...restOfSessionData,
		};
	}
}

export default OnboardingInviteUseCase;
