import { GlobalEventTypes } from "../../../../shared/application/enum/event.enum.js";
import type { EventBusPort } from "../../../../shared/application/port/services/eventbus.port.js";
import type { WorkflowEventsPort } from "../../../application/port/events/WorkflowEvents.port.js";

class WorkflowEventsAdapter implements WorkflowEventsPort {
	constructor(private readonly eventBus: EventBusPort) {}

	async wrkflowAssigned(payload: {
		workflowInstanceId: string;
		stepOrder: number;
		role: string;
		assignedTo: string[];
		documentId: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.workflow.WORKFLOW_TASKS_ASSIGNED,
            occurredAt: new Date(),
			payload: {
				workflowInstanceId: payload.workflowInstanceId,
				stepOrder:payload.stepOrder,
				role: payload.role,
				assignedTo: payload.assignedTo,
				documentId: payload.documentId,
			},
		});
	}
}

export default WorkflowEventsAdapter;
