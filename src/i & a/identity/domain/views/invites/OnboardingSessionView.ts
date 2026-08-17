import type { PrimaryData } from "../../entities/user/OnboardingSession.js";
import type { OnboardingSessionStatus } from "../../enum/onboardingSessionStatus.enum.js";

interface OnboardingSessionViewPayload {
	id: string;
	inviteId: string;
	email: string;

	currentStep: number;
	primaryData: PrimaryData;
	storageProvider: string;
	profilePictureBucketName: string | null;
	profilePictureObjectKey: string | null;
	profilePictureFormat: string | null;
	signatureBucketName: string | null;
	signatureObjectKey: string | null;
	signatureFormat: string | null;

	status: OnboardingSessionStatus;
	startedAt: Date;
	lastActiveAt: Date | null;
	completedAt: Date | null;
}

class OnboardingSessionView {
	constructor(payload: OnboardingSessionViewPayload) {
		this.id = payload.id;
		this.inviteId = payload.inviteId;
		this.email = payload.email;

		this.currentStep = payload.currentStep;
		this.primaryData = payload.primaryData;
		this.storageProvider = payload.storageProvider;
		this.profilePictureBucketName = payload.profilePictureBucketName;
		this.profilePictureObjectKey = payload.profilePictureObjectKey;
        this.profilePictureFormat = payload.profilePictureFormat;
		this.signatureBucketName = payload.signatureBucketName;
		this.signatureObjectKey = payload.signatureObjectKey;
        this.signatureFormat = payload.signatureFormat;

		this.status = payload.status;
		this.startedAt = new Date(payload.startedAt);
		this.lastActiveAt = payload.lastActiveAt ?? null;
		this.completedAt = payload.completedAt ?? null;
	}

	readonly id: string;
	readonly inviteId: string;
	readonly email: string;

	readonly currentStep: number;
	readonly primaryData: PrimaryData;
	readonly storageProvider: string;
	readonly profilePictureBucketName: string | null;
	readonly profilePictureObjectKey: string | null;
	readonly profilePictureFormat: string | null;
	readonly signatureBucketName: string | null;
	readonly signatureObjectKey: string | null;
	readonly signatureFormat: string | null;

	readonly status: OnboardingSessionStatus;
	readonly startedAt: Date;
	readonly lastActiveAt: Date | null;
	readonly completedAt: Date | null;
}

export default OnboardingSessionView;
