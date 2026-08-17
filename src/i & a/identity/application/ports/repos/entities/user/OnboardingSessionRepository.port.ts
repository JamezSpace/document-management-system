import type OnboardingSession from "../../../../../domain/entities/user/OnboardingSession.js";
import type OnboardingSessionView from "../../../../../domain/views/invites/OnboardingSessionView.js";

interface OnboardingSessionRepositoryPort {
    save(payload: OnboardingSession): Promise<OnboardingSession>;
    
    update(sessionId: string, payload: Partial<OnboardingSession>): Promise<OnboardingSession>;

    findSessionById(sessionId: string): Promise<OnboardingSession | null>;
    
    findSessionByInviteId(inviteId: string): Promise<OnboardingSession | null>;

    fetchAll(): Promise<OnboardingSessionView[]>;

    assignOnboardingSessionMedia(
		sessionId: string,
		payload: {
			profilePictureMediaId?: string;
			signatureMediaId?: string;
		},
	): Promise<void>;
}

export type { OnboardingSessionRepositoryPort };

