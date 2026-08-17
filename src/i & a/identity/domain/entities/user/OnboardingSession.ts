import type { OnboardingSessionStatus } from "../../enum/onboardingSessionStatus.enum.js";

interface PrimaryData {
	firstName: string;
	lastName: string;
	middleName: string;
	email: string;
    phoneNumber: string;
	staffId: number;
}

interface OnboardingSessionPayload {
	id: string;
	inviteId: string;
	email: string;

	currentStep: number;
	primaryData?: PrimaryData;
	profilePictureMediaId?: string;
	signatureMediaId?: string;

	status: OnboardingSessionStatus;
	startedAt: Date;
	lastActiveAt?: Date;
	completedAt?: Date;
}

class OnboardingSession {
	id: string;
	inviteId: string;
	email: string;

	currentStep: number;
	primaryData: PrimaryData | null;
	profilePictureMediaId: string | null;
	signatureMediaId: string | null;

	status: OnboardingSessionStatus;
	startedAt: Date;
	lastActiveAt: Date | null;
	completedAt: Date | null;

	constructor(payload: OnboardingSessionPayload) {
		this.id = payload.id;
		this.inviteId = payload.inviteId;
		this.email = payload.email;
		this.currentStep = payload.currentStep;
		this.primaryData = payload.primaryData ?? null;
		this.profilePictureMediaId =
			payload.profilePictureMediaId ?? null;
		this.signatureMediaId = payload.signatureMediaId ?? null;
		this.status = payload.status;
		this.startedAt = payload.startedAt;
		this.lastActiveAt = payload.lastActiveAt ?? null;
		this.completedAt = payload.completedAt ?? null;
	}
}

export default OnboardingSession;
export type {PrimaryData};
