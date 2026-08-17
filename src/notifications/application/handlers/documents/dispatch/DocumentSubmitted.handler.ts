import type { EventDetails } from "../../../../../shared/application/port/services/eventbus.port.js";
import { NotificationPriority } from "../../../../domain/enum/NotificationPriority.enum.js";
import { NotificationRecipientType } from "../../../../domain/enum/NotificationRecipientType.enum.js";
import type CreateNotificationUseCase from "../../../usecases/CreateNotification.usecase.js";

class DocumentSubmittedHandler {
	constructor(
		private readonly createNotificationUseCase: CreateNotificationUseCase,
	) {}

	async handle(ev: EventDetails) {
		const { documentId, submittedBy, recipientId } = ev.payload;

        // this ensuring dispatch 
        if(!recipientId) return;

		const subjectType = "DOCUMENT";

		await this.createNotificationUseCase.execute({
			actorId: submittedBy,
			recipientId: "ADMIN",
			recipientType: NotificationRecipientType.ROLE,
			priority: NotificationPriority.NORMAL,
			eventType: ev.eventName,
			subjectType,
			subjectId: documentId,
			inAppSubjectName: `Document ${documentId}`,
			payload: ev.payload,
		});
	}
}

export default DocumentSubmittedHandler;
