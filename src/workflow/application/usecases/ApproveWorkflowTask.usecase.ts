import type { WorkflowDocumentPort } from "../../../shared/application/port/intersubsystem/WorkflowDocument.port.js";
import type { WorkflowPolicyPort } from "../../../shared/application/port/intersubsystem/WorkflowPolicy.port.js";
import type { TransactionManager } from "../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import type WorkflowEngine from "../../domain/WorkflowEngine.service.js";
import { WorkflowStatus } from "../../domain/enum/WorkflowStatus.enum.js";
import type { WorkflowRepositoryPort } from "../port/repos/WorkflowRepository.port.js";
import type { ApproverResolverServicePort } from "../port/services/ApproverResolverServicePort.js";

class ApproveTaskUseCase {
	constructor(
		private readonly workflowRepository: WorkflowRepositoryPort,
		private readonly workflowPolicyPort: WorkflowPolicyPort,
		private readonly workflowDocumentPort: WorkflowDocumentPort,
		private readonly workflowEngine: WorkflowEngine,
		private readonly approverResolver: ApproverResolverServicePort,
		private readonly transactionManager: TransactionManager,
	) {}

	async execute(taskId: string, actorId: string, minuteId?: string | null) {
		return this.transactionManager.execute(async (tx) => {
			const taskReference =
				await this.workflowRepository.getTaskById(taskId, tx);

			if (!taskReference) {
				throw new ApplicationError(ApplicationErrorEnum.TASK_NOT_FOUND, {
					message: "Task not found",
				});
			}

			// Serialize decisions for the same workflow so concurrent final
			// approvals cannot advance a step more than once.
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

			// Reload after acquiring the workflow lock so validation uses the
			// latest committed task state.
			const task = await this.workflowRepository.getTaskById(taskId, tx);

			if (!task) {
				throw new ApplicationError(ApplicationErrorEnum.TASK_NOT_FOUND, {
					message: "Task not found",
				});
			}

			if (!task.canBeActionedBy(actorId)) {
				throw new ApplicationError(
					ApplicationErrorEnum.USER_NOT_AUTHORIZED,
					{ message: "You are not allowed to approve this task" },
				);
			}

			if (!task.isPending()) {
				throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
					message: "Task already processed",
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

			task.approve(actorId, minuteId);
			await this.workflowRepository.updateTask(task, tx);

			const stepTasks = await this.workflowRepository.getTasksByStep(
				instance.id,
				task.stepOrder,
				tx,
			);

			if (!this.workflowEngine.isStepComplete(stepTasks)) {
				return {
					message: "Task approved. Waiting for other approvers.",
				};
			}

			const workflowSteps =
				await this.workflowPolicyPort.getApprovalSteps(
					instance.documentId,
					tx,
				);
			const nextStep = this.workflowEngine.getNextStep(
				workflowSteps,
				task.stepOrder,
			);

			if (!nextStep) {
				instance.complete();
				await this.workflowRepository.updateInstance(instance, tx);

				return { message: "Workflow completed successfully" };
			}

			const document = await this.workflowDocumentPort.getDocumentById(
				instance.documentId,
				tx,
			);
			const userIds = await this.approverResolver.resolve(
				document,
				nextStep.role,
				nextStep.resolutionStrategy,
			);

			if (userIds.length === 0) {
				throw new ApplicationError(
					ApplicationErrorEnum.APPROVER_NOT_FOUND,
					{ message: "No approvers found for next step" },
				);
			}

			const newTasks = this.workflowEngine.createTasks(
				instance.id,
				nextStep,
				userIds,
			);

			instance.moveToStep(nextStep.stepOrder);
			await this.workflowRepository.updateInstance(instance, tx);
			await this.workflowRepository.saveTasks(newTasks, tx);

			return {
				message: "Step completed. Workflow advanced.",
				nextStep: nextStep.stepOrder,
			};
		});
	}
}

export default ApproveTaskUseCase;
