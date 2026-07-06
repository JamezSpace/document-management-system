import type GetWorkflowUseCase from "../../application/usecases/GetWorkflow.usecase.js";
import type ApproveTaskUseCase from "../../application/usecases/ApproveWorkflowTask.usecase.js";
import type RejectTaskUseCase from "../../application/usecases/RejectWorkflowTask.usecase.js";

class WorkflowController {
    constructor(
        private readonly getWorkflowUseCase: GetWorkflowUseCase,
        private readonly approveTaskUseCase: ApproveTaskUseCase,
        private readonly rejectTaskUseCase: RejectTaskUseCase,
    ){}

    async getWorkflowByDocument(documentId: string) {
        const workflow = await this.getWorkflowUseCase.getWorkflowByDocument(documentId)

        return workflow;
    }

    async approveTask(taskId: string, actorId: string, minuteId?: string | null) {
        return this.approveTaskUseCase.execute(taskId, actorId, minuteId);
    }

    async rejectTask(taskId: string, actorId: string, minuteId: string) {
        return this.rejectTaskUseCase.execute(taskId, actorId, minuteId);
    }
}

export default WorkflowController
