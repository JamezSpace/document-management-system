import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import type { WorkflowRepositoryPort } from "../port/repos/WorkflowRepository.port.js";


class RejectTaskUseCase {
	constructor(
		private readonly workflowRepository: WorkflowRepositoryPort
	) {}

	async execute(taskId: string, actorId: string, minuteId: string) {
		// fetch task
		const task = await this.workflowRepository.getTaskById(taskId);

		if (!task) {
			throw new ApplicationError(
				ApplicationErrorEnum.TASK_NOT_FOUND,
				{ message: "Workflow task not found" }
			);
		}

		// reject task (domain enforces auth + state)
		task.reject(actorId, minuteId);

		// fetch workflow instance
		const instance = await this.workflowRepository.getInstanceById(
			task.workflowInstanceId
		);

		if (!instance) {
			throw new ApplicationError(
				ApplicationErrorEnum.WRKFLOW_NOT_FOUND,
				{ message: "Workflow instance not found" }
			);
		}

		// reject entire workflow
		instance.reject();

		// persist
		await this.workflowRepository.updateTask(task);
		await this.workflowRepository.updateInstance(instance);

		// optional (later)
		// await auditPort.log(...)
		// await eventBus.publish(...)

		return {
			workflowInstanceId: instance.id,
			status: "REJECTED",
		};
	}
}

export default RejectTaskUseCase;
