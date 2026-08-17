interface WorkflowStarterPort {
	startWorkflow(documentId: string): Promise<void>;
}

export type { WorkflowStarterPort };