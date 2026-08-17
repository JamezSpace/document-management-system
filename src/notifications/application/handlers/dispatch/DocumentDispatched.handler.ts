import type { EventDetails } from "../../../../shared/application/port/services/eventbus.port.js";
import type { DocumentDispatchedNotificationPayload } from "../../../../shared/application/types/dispatchNotification/dispatchNotification.type.js";
import { NotificationPriority } from "../../../domain/enum/NotificationPriority.enum.js";
import { NotificationRecipientType } from "../../../domain/enum/NotificationRecipientType.enum.js";
import type CreateNotificationUseCase from "../../usecases/CreateNotification.usecase.js";

class DocumentDispatchedHandler {
	constructor(
		private readonly createNotificationUseCase: CreateNotificationUseCase,
	) {}

	async handle(ev: EventDetails) {
		const eventPayload = ev.payload as DocumentDispatchedNotificationPayload;
		const { document, recipients, sender } = eventPayload;

		// this ensures there are actual recipients to notify
		if (!recipients || recipients.length === 0) return;

		const subjectType = "DOCUMENT_DISPATCHED";

		for (const recipientId of recipients) {
			await this.createNotificationUseCase.execute({
				actorId: sender.id,
				recipientId: recipientId,
				recipientType: NotificationRecipientType.USER,
				priority: NotificationPriority.NORMAL,
				eventType: ev.eventName,
				subjectType,
				subjectId: document.id,
				inAppSubjectName: `Document ${document.id}`,
				payload: eventPayload,
			});
		}
	}
}

export default DocumentDispatchedHandler;
