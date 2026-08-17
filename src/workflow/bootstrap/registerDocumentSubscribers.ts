import { GlobalEventTypes } from "../../shared/application/enum/event.enum.js";
import type { EventBusPort } from "../../shared/application/port/services/eventbus.port.js";
import type { WorkflowStarterPort } from "../../shared/application/port/WorkflowStarter.port.js";

export default function registerAllWorkflowSubscribers(
	eventBus: EventBusPort,
	workflowStarter: WorkflowStarterPort
) {
	eventBus.subscribe(
		GlobalEventTypes.document.document.DOCUMENT_SUBMITTED,
		async (event) => {
			await workflowStarter.startWorkflow(event.payload.documentId);
		}
	);
}