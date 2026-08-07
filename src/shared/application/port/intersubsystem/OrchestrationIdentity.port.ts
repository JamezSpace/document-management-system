interface WorkspaceActor {
	id: string;
}

interface OrchestrationIdentityPort {
	getStaffFromUid(uid: string): Promise<WorkspaceActor | null>;
}

export type { 
    OrchestrationIdentityPort, 
	WorkspaceActor as Staff,
};

