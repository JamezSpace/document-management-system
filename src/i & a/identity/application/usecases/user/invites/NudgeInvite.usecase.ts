import ApplicationError from "../../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../../shared/errors/enum/application.enum.js";
import type { InviteRepositoryPort } from "../../../ports/repos/entities/user/InviteRepository.port.js";
import type { OnboardingSessionRepositoryPort } from "../../../ports/repos/entities/user/OnboardingSessionRepository.port.js";
import type { IdentityEmailServicePort } from "../../../ports/services/EmailService.port.js";
import {
    generateIncompleteOnboardingNudgeTemplate,
    generateUnstartedNudgeTemplate,
} from "../../../templates/NudgeInvite.template.js";

class NudgeInviteUsecase {
	constructor(
		private readonly emailService: IdentityEmailServicePort,
		private readonly inviteRepo: InviteRepositoryPort,
		private readonly onboardingSessionRepo: OnboardingSessionRepositoryPort,
	) {}

	async execute(inviteId: string) {
		const invite = await this.inviteRepo.findById(inviteId);
		const onboardingSession =
			await this.onboardingSessionRepo.findSessionByInviteId(inviteId);

		if (!invite)
			throw new ApplicationError(ApplicationErrorEnum.INVITE_NOT_FOUND, {
				message: `Invite with id ${inviteId} not found.`,
			});

		const onboardingLink = `${process.env.FRONTEND_ORIGIN}/staff/onboarding?token=${invite.token}`;

        let sentStatus = false;
		if (onboardingSession)
			sentStatus = await this.emailService.nudgeInvite(
				invite.email,
				generateIncompleteOnboardingNudgeTemplate(onboardingLink),
			);
		else
			sentStatus = await this.emailService.nudgeInvite(
				invite.email,
				generateUnstartedNudgeTemplate(onboardingLink),
			);

        return sentStatus;
	}
}

export default NudgeInviteUsecase;
