import type { EventDetails } from "../../../../shared/application/port/services/eventbus.port.js";
import { NotificationPriority } from "../../../domain/enum/NotificationPriority.enum.js";
import { NotificationRecipientType } from "../../../domain/enum/NotificationRecipientType.enum.js";
import type CreateNotificationUseCase from "../../usecases/CreateNotification.usecase.js";

class WorkflowTasksAssignedHandler {
	constructor(
		private readonly createNotification: CreateNotificationUseCase,
	) {}

	async handle(ev: EventDetails) {
		const { assignedTo, documentId, workflowInstanceId, stepOrder } =
			ev.payload;

		const subjectType = "WORKFLOW_TASK";

		await Promise.all(
			assignedTo.map((userId: any) =>
				this.createNotification.execute({
					actorId: "SYSTEM", // system triggered
					recipientId: userId,
					recipientType: NotificationRecipientType.USER,
					priority: NotificationPriority.HIGH,
					eventType: ev.eventName,
					subjectType,
					subjectId: workflowInstanceId,
					inAppSubjectName: `Workflow Step ${stepOrder}`,
					payload: {
						documentId,
						workflowInstanceId,
						stepOrder,
					},
				}),
			),
		);
	}
}

export default WorkflowTasksAssignedHandler;
