interface WorkflowAuditPort {
	log(event: {
		type: string;
		actorId: string;
		subjectId: string;
		payload?: unknown;
	}): Promise<void>;
}

export type { WorkflowAuditPort };
