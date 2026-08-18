import type { OrchestrationWorkflowPort, WorkflowContext } from "../../../shared/application/port/intersubsystem/OrcestrationWorkflow.port.js";
import type { WorkflowPolicyPort } from "../../../shared/application/port/intersubsystem/WorkflowPolicy.port.js";
import type WorkflowInstance from "../../domain/entities/WorkflowInstance.js";
import { WorkflowStatus } from "../../domain/enum/WorkflowStatus.enum.js";
import type WorkflowEngine from "../../domain/WorkflowEngine.service.js";
import type { WorkflowRepositoryPort } from "../port/repos/WorkflowRepository.port.js";

class EvaluateWorkflowContextUsecase implements OrchestrationWorkflowPort {
    constructor(
        private readonly workflowEngine: WorkflowEngine,
        private readonly workflowRepository: WorkflowRepositoryPort,
        private readonly workflowPolicyPort: WorkflowPolicyPort,
    ){}

    async canTransitionToNextStep(workflow: WorkflowInstance) {
        if(workflow.status === WorkflowStatus.COMPLETED) return false;

        // check if current step is terminal
        const workflowSteps =
			await this.workflowPolicyPort.getApprovalSteps(workflow.documentId);

        // terminal step implies document cant advance, same applies on the contrary
        return !this.workflowEngine.isTerminalStep(workflowSteps.length, workflow.currentStep);
    }

    async canReturnToAuthor(workflow: WorkflowInstance) {
        if(workflow.status === WorkflowStatus.COMPLETED) return false;


        return true;
    }

    async isCompleted(workflow: WorkflowInstance) {
        return workflow.status === WorkflowStatus.COMPLETED;
    }

    async wasRejected(workflow: WorkflowInstance) {
        return workflow.status === WorkflowStatus.REJECTED;
    }

    async getWorkflowContext(documentId: string): Promise<WorkflowContext | null> {
        const workflow = await this.workflowRepository.getInstanceByDocumentId(documentId);

        if (!workflow) return null;

        
        const canAdvance = await this.canTransitionToNextStep(workflow);
        const canReject = await this.canReturnToAuthor(workflow);
        const completed = await this.isCompleted(workflow);
        const rejected = await this.wasRejected(workflow);

        return {
            canAdvance,
            canReject,
            completed,
            rejected
        }
    }
}

export default EvaluateWorkflowContextUsecase;
