import type { WorkflowRepositoryPort } from "../port/repos/WorkflowRepository.port.js";

class GetWorkflowUseCase {
    constructor(private readonly workflowRepository: WorkflowRepositoryPort){}

    async getWorkflowByDocument(documentId: string) {
        const workflowInstance = await this.workflowRepository.getInstanceByDocumentId(documentId);

        return workflowInstance;
    }
}

export default GetWorkflowUseCase;