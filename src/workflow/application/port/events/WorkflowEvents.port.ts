interface WorkflowEventsPort {
    wrkflowAssigned(payload: {
        workflowInstanceId: string;
        stepOrder: number;
        role: string;
        assignedTo: string[];
        documentId: string;
    }): Promise<void>
}

export type {WorkflowEventsPort};