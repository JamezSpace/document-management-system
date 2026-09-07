import type {
	WorkItem,
	WorkItemQuery,
} from "../types/workItem.type.js";

interface WorkItemRepositoryPort {
	listForActor(actorId: string, query: WorkItemQuery): Promise<WorkItem[]>;
	findForActor(actorId: string, workItemId: string): Promise<WorkItem | null>;
}

export type { WorkItemRepositoryPort };
