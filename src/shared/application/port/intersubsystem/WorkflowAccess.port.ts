interface WorkflowAccessPort {
    // staff reporting
    findActiveSupervisor(staffId: string): Promise<{
		supervisorId: string;
	} | null>;

	findByHierarchy(staffId: string): Promise<{
		supervisorId: string;
	} | null>;


    // role assignment
    findByRoleAndScope(
            role: string,
            scope: { unitId?: string; officeId?: string }
        ): Promise<string[]>;
}

export type { WorkflowAccessPort };
