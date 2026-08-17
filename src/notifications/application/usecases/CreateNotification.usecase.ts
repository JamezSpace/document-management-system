import type { IdGeneratorPort } from "../../../shared/application/port/services/IdGenerator.port.js";
import Notification from "../../domain/entities/Notifications.js";
import { NotificationPreference } from "../../domain/enum/NotificationPreference.enum.js";
import { NotificationTemplateEngine } from "../../domain/templates/notificationTemplates.registry.js";
import type { NotificationRepositoryPort } from "../port/NotificationsRepo.port.js";
import type { CreateNotificationType } from "../types/CreateNotification.type.js";

class CreateNotificationUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly notificationRepo: NotificationRepositoryPort,
	) {}

	async execute(initNotification: CreateNotificationType) {
		// replace with db call to fetch user preference which serves as activeChannels
		const activeChannels = [
			NotificationPreference.IN_APP,
			// NotificationPreference.EMAIL,
		];

		const generatedEntities: Notification[] = [];

		for (const channel of activeChannels) {
			const id = "NOTIF-" + this.idGenerator.generate();

			const rendered = NotificationTemplateEngine.render(
				initNotification.eventType,
				channel,
				initNotification.payload,
			);

			const newNotifDTO = {
				notificationId: id,
				recipientId: initNotification.recipientId,
				recipientType: initNotification.recipientType,
				eventType: initNotification.eventType,
				subjectType: initNotification.subjectType,
				subjectId: initNotification.subjectId,
				payload: initNotification.payload,
				channel,
				priority: initNotification.priority,
				messageTemplate: rendered.message,
			};

			if (channel === NotificationPreference.IN_APP)
				Object.assign(newNotifDTO, {
					inAppSubjectName: rendered.header,
				});
			else
				Object.assign(newNotifDTO, {
					emailSubjectHeader: rendered.header,
				});

			const entity = new Notification(newNotifDTO);

			await this.notificationRepo.save(entity);
			generatedEntities.push(entity);
		}

		return generatedEntities;
	}
}

export default CreateNotificationUseCase;
