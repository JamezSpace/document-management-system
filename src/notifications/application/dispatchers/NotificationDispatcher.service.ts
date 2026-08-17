import { NotificationPreference } from "../../domain/enum/NotificationPreference.enum.js";
import type EmailSenderService from "../../infrastructure/senders/EmailSender.service.js";
import type InAppSenderService from "../../infrastructure/senders/InAppSender.service.js";
import type { NotificationRepositoryPort } from "../port/NotificationsRepo.port.js";

class NotificationDispatcher {
	constructor(
		private readonly notifRepo: NotificationRepositoryPort,
		private readonly emailSenderService: EmailSenderService,
		private readonly inAppSenderService: InAppSenderService,
	) {}

	async dispatch() {
		const pendingNotifications = await this.notifRepo.findPending();

		for (const notif of pendingNotifications) {
			try {
				if (notif.channel === NotificationPreference.EMAIL) {
					await this.emailSenderService.send(notif);
				}

				if (notif.channel === NotificationPreference.IN_APP) {
					await this.inAppSenderService.send(notif);
				}

				notif.markSent();
			} catch {
				notif.markFailed();
			}

			await this.notifRepo.update(notif);
		}
	}
}

export default NotificationDispatcher;
