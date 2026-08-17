import type { NotificationIdentityPort } from "../../../shared/application/port/intersubsystem/NotificationIdentity.port.js";
import type { GlobalEmailServicePort } from "../../../shared/application/port/services/emailService.port.js";
import Notification from "../../domain/entities/Notifications.js";

class EmailSenderService {
	constructor(
		private readonly emailService: GlobalEmailServicePort,
		private readonly notifIdentity: NotificationIdentityPort,
	) {}

	async send(notification: Notification) {
		const recipient = await this.notifIdentity.getStaffById(
			notification.recipientId,
		);

		await this.emailService.sendTo(
			{
				recipientEmail: recipient.email,
				message: notification.messageTemplate,
			},
			"notification",
		);
	}
}

export default EmailSenderService;
