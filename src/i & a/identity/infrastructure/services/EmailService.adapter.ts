import type { GlobalEmailServicePort } from "../../../../shared/application/port/services/emailService.port.js";
import type { IdentityEmailServicePort } from "../../application/ports/services/EmailService.port.js";

class IdentityEmailServiceAdapter implements IdentityEmailServicePort {
	constructor(private readonly emailService: GlobalEmailServicePort) {}

	async sendOnboardingLink(
		recipientEmail: string,
		message: string,
	): Promise<void> {
		try {
			await this.emailService.sendTo(
				{ recipientEmail, message },
				"onboarding",
			);
		} catch (err: any) {
			console.error("Email failed to send, but user was created:", err);
		}
	}

	async nudgeInvite(recipientEmail: string, message: string): Promise<boolean> {
		try {
			const sent = await this.emailService.sendTo(
				{
					recipientEmail,
					message,
				},
				"onboarding",
			);

            return sent;
		} catch (error: any) {
			console.error("Email failed to send, but user was created:", error);

            return false
		}
	}

    async notifyInviteOfSuccessfulAccountActivation(recipientEmail: string, message: string): Promise<void> {
        try {
			await this.emailService.sendTo(
				{ recipientEmail, message },
				"onboarding",
			);
		} catch (err: any) {
			console.error("Email failed to send, but user was created:", err);
		}
    }
}

export default IdentityEmailServiceAdapter;
