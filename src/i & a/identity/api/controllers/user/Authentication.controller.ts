import type GetAllUsersUseCase from "../../../application/usecases/user/GetAllUsers.usecase.js";
import type OnboardingInviteUseCase from "../../../application/usecases/user/invites/OnboardInvite.usecase.js";
import type {
    EditOnboardingSessionType,
    InitOnboardingSessionType,
} from "../../types/user/user.type.js";

class AuthenticationController {
	constructor(
		private readonly onboardInviteUseCase: OnboardingInviteUseCase,
		private readonly getAllUsersUseCase: GetAllUsersUseCase,
	) {}

	async getAllUsers() {
		const users = await this.getAllUsersUseCase.getAllUsers();

		return users;
	}

    async getInvite(token: string) {
        const invite = await this.onboardInviteUseCase.getInvite(token)

        return invite;
    }

    async initOnboardingSession(payload: InitOnboardingSessionType) {
        const newOnboardingSession = await this.onboardInviteUseCase.initOnboardingSession(payload);

        return newOnboardingSession;
    }

    async getOnboardingSession(inviteId: string) {
        const onboardingSession = await this.onboardInviteUseCase.getOnboardingSessionByInviteId(inviteId);

        return onboardingSession;
    }

    async getAllOnboardingSessions() {
        const onboardingSessions = await this.onboardInviteUseCase.getAllOnboardingSessions()

        return onboardingSessions;
    }

	async updateInviteField(
		inviteId: string,
		fieldToUpdate: Parameters<OnboardingInviteUseCase["updateInviteField"]>[1],
		valueToInsert: Parameters<OnboardingInviteUseCase["updateInviteField"]>[2],
	) {
		const updatedInvite = await this.onboardInviteUseCase.updateInviteField(
			inviteId,
			fieldToUpdate,
			valueToInsert,
		);

		return updatedInvite;
	}

	async updateOnboardingSession(
		sessionId: string,
		payload: EditOnboardingSessionType
	) {
		const updatedSession = await this.onboardInviteUseCase.updateOnboardingSession(
			sessionId,
			payload,
		);

		return updatedSession;
	}

	async uploadOnboardingMedia(
		sessionId: string,
		payload: {
			profilePic?: { buffer: Buffer; mimeType?: string };
			signatureFile?: { buffer: Buffer; mimeType?: string };
			currentStep: number;
		},
	) {
		const updatedSession = await this.onboardInviteUseCase.uploadOnboardingMedia(
			sessionId,
			payload,
		);

		return updatedSession;
	}

    async completeOnboardingSession(inviteId: string, sessionId: string) {
        const completedSession = await this.onboardInviteUseCase.completeOnboardingSession(inviteId, sessionId);

		return completedSession;
    }
}

export default AuthenticationController;
