import type { EventDetails } from "../../../../shared/application/port/services/eventbus.port.js";
import { NotificationPriority } from "../../../domain/enum/NotificationPriority.enum.js";
import { NotificationRecipientType } from "../../../domain/enum/NotificationRecipientType.enum.js";
import type CreateNotificationUseCase from "../../usecases/CreateNotification.usecase.js";

class BusinessFunctionCreatedHandler {
	constructor(
		private readonly createNotificationUseCase: CreateNotificationUseCase,
	) {}

	async handle(ev: EventDetails) {
		const { businessFunction, actorId } = ev.payload;

		const subjectType = "BUSINESS_FUNCTION";

        // recipient id should be resolved by role "admin" 
		await this.createNotificationUseCase.execute({
			actorId,
			recipientId: "ADMIN",
			recipientType: NotificationRecipientType.ROLE,
			priority: NotificationPriority.LOW,
			eventType: ev.eventName,
			subjectType,
			subjectId: businessFunction.id,
			inAppSubjectName: businessFunction.name,
			payload: ev.payload,
		});
	}
}

export default BusinessFunctionCreatedHandler;
