import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import type { WorkItemRepositoryPort } from "../ports/WorkItemRepository.port.js";

class GetWorkItemUseCase {
	constructor(private readonly repository: WorkItemRepositoryPort) {}

	async execute(actorId: string, workItemId: string) {
		const item = await this.repository.findForActor(actorId, workItemId);
		if (!item) {
			throw new ApplicationError(ApplicationErrorEnum.TASK_NOT_FOUND, {
				message: `Work item ${workItemId} was not found`,
			});
		}
		return item;
	}
}

export default GetWorkItemUseCase;
