import type { OrchestrationWorkflowPort } from "../../../../shared/application/port/intersubsystem/OrcestrationWorkflow.port.js";

class GetWorkflowContextUsecase {
	constructor(
		private readonly orchestrationWorkflowPort: OrchestrationWorkflowPort,
	) {}

	async execute(documentId: string) {
		const workflowContext =
			this.orchestrationWorkflowPort.getWorkflowContext(documentId);

		return workflowContext;
	}
}

export default GetWorkflowContextUsecase;
