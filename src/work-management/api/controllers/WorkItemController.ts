import type GetWorkItemUseCase from "../../application/usecases/GetWorkItem.usecase.js";
import type ListWorkItemsUseCase from "../../application/usecases/ListWorkItems.usecase.js";
import type { WorkItemQueryType } from "../types/workItem.types.js";

class WorkItemController {
	constructor(
		private readonly listWorkItems: ListWorkItemsUseCase,
		private readonly getWorkItem: GetWorkItemUseCase,
	) {}

	list(actorId: string, query: WorkItemQueryType) {
		return this.listWorkItems.execute(actorId, query);
	}

	get(actorId: string, workItemId: string) {
		return this.getWorkItem.execute(actorId, workItemId);
	}
}

export default WorkItemController;
