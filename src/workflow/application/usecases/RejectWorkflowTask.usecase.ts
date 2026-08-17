import type { TransactionManager } from "../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import { WorkflowStatus } from "../../domain/enum/WorkflowStatus.enum.js";
import type { WorkflowRepositoryPort } from "../port/repos/WorkflowRepository.port.js";

class RejectTaskUseCase {
	constructor(
		private readonly workflowRepository: WorkflowRepositoryPort,
		private readonly transactionManager: TransactionManager,
	) {}

	async execute(taskId: string, actorId: string, minuteId: string) {
		return this.transactionManager.execute(async (tx) => {
			const taskReference =
				await this.workflowRepository.getTaskById(taskId, tx);

			if (!taskReference) {
				throw new ApplicationError(ApplicationErrorEnum.TASK_NOT_FOUND, {
					message: "Workflow task not found",
				});
			}

			const instance = await this.workflowRepository.getInstanceById(
				taskReference.workflowInstanceId,
				tx,
				{ forUpdate: true },
			);

			if (!instance) {
				throw new ApplicationError(
					ApplicationErrorEnum.WRKFLOW_NOT_FOUND,
					{ message: "Workflow instance not found" },
				);
			}

			const task = await this.workflowRepository.getTaskById(taskId, tx);

			if (!task) {
				throw new ApplicationError(ApplicationErrorEnum.TASK_NOT_FOUND, {
					message: "Workflow task not found",
				});
			}

			if (
				instance.status !== WorkflowStatus.IN_PROGRESS ||
				instance.currentStep !== task.stepOrder
			) {
				throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
					message: "Task does not belong to the active workflow step",
				});
			}

			task.reject(actorId, minuteId);
			instance.reject();

			await this.workflowRepository.updateTask(task, tx);
			await this.workflowRepository.updateInstance(instance, tx);

			return {
				workflowInstanceId: instance.id,
				status: WorkflowStatus.REJECTED,
			};
		});
	}
}

export default RejectTaskUseCase;
