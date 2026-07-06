interface WorkflowContext {
    canAdvance: boolean;
    canReject: boolean;
    completed: boolean;
    rejected: boolean;
}

interface OrchestrationWorkflowPort {
    getWorkflowContext(documentId: string): Promise<WorkflowContext>;
}

export type {OrchestrationWorkflowPort, WorkflowContext};

