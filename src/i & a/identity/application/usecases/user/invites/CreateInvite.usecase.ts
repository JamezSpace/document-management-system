import type { IdGeneratorPort } from "../../../../../../shared/application/port/services/IdGenerator.port.js";
import { InviteStatus } from "../../../../domain/enum/staff.enum.js";
import type { InviteRepositoryPort } from "../../../ports/repos/entities/user/InviteRepository.port.js";
import type { IdentityEmailServicePort } from "../../../ports/services/EmailService.port.js";
import type { TokenServicePort } from "../../../ports/services/TokenService.port.js";
import { generateNewInviteTemplate } from "../../../templates/NewInvite.template.js";
import type { InviteStaffPayload } from "../../../types/staff/staff.type.js";

class CreateInviteUseCase {
    constructor(
        private readonly idGenerator: IdGeneratorPort,
        private readonly tokenService: TokenServicePort,
        private readonly emailService: IdentityEmailServicePort,
        private readonly inviteRepo: InviteRepositoryPort,
    ){}

    async inviteStaff(payload: InviteStaffPayload) {
        const inviteId = "INVITE-" + this.idGenerator.generate();

		// generate invite token
		const token = this.tokenService.generate(inviteId, 'staff');

		const invite = await this.inviteRepo.save({
            id: inviteId,
			email: payload.email,
            unitId: payload.unitId,
			officeId: payload.officeId,
			designationId: payload.designationId,
			employmentType: payload.employmentType,
			invitedBy: payload.createdBy,
			token,
            isUsed: false,
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24hrs
			status: InviteStatus.PENDING,
            createdAt: new Date()
        });

        const onboardingLink = `${process.env.FRONTEND_ORIGIN}/staff/onboarding?token=${token}`;

        // TODO: send or store this in a message queue to enable failed retries 
        await this.emailService.sendOnboardingLink(
            payload.email,
            generateNewInviteTemplate(onboardingLink),
        );

        return { inviteId: invite.id };
	}
}

export default CreateInviteUseCase;