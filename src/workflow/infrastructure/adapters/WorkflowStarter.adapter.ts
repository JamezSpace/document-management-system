import type { WorkflowStarterPort } from "../../../shared/application/port/WorkflowStarter.port.js";
import type StartWorkflowUseCase from "../../application/usecases/StartWorkflow.usecase.js";

class WorkflowStarterAdapter implements WorkflowStarterPort {
	constructor(
		private readonly startWorkflowUseCase: StartWorkflowUseCase
	) {}

	async startWorkflow(documentId: string): Promise<void> {
		await this.startWorkflowUseCase.execute(documentId);
	}
}

export default WorkflowStarterAdapter;