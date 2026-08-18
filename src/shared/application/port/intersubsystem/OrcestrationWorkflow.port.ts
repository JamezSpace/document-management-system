interface WorkflowContext {
    canAdvance: boolean;
    canReject: boolean;
    completed: boolean;
    rejected: boolean;
}

interface OrchestrationWorkflowPort {
    getWorkflowContext(documentId: string): Promise<WorkflowContext | null>;
}

export type {OrchestrationWorkflowPort, WorkflowContext};

