import type WorkflowStep from "../../../../workflow/domain/entities/WorkflowStep.js";
import type { TransactionContext } from "../../../infrastructure/persistence/primary/postgres.js";

interface WorkflowPolicyPort {
	getApprovalSteps(documentId: string, tx?: TransactionContext): Promise<WorkflowStep[]>;
}

export type { WorkflowPolicyPort };

