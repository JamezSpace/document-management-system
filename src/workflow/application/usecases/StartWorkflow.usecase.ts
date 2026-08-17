import type { WorkflowDocumentPort } from "../../../shared/application/port/intersubsystem/WorkflowDocument.port.js";
import type { WorkflowPolicyPort } from "../../../shared/application/port/intersubsystem/WorkflowPolicy.port.js";
import type { IdGeneratorPort } from "../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import type WorkflowEngine from "../../domain/WorkflowEngine.service.js";
import type { WorkflowEventsPort } from "../port/events/WorkflowEvents.port.js";
import type { WorkflowRepositoryPort } from "../port/repos/WorkflowRepository.port.js";
import type { ApproverResolverServicePort } from "../port/services/ApproverResolverServicePort.js";

class StartWorkflowUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly worflowDocumentPort: WorkflowDocumentPort,
		private readonly workflowPolicyPort: WorkflowPolicyPort,
		private readonly workflowEngine: WorkflowEngine,
		private readonly approverResolverService: ApproverResolverServicePort,
		private readonly workflowRepository: WorkflowRepositoryPort,
		private readonly workflowEventsPort: WorkflowEventsPort,
		private readonly transactionManager: TransactionManager,
	) {}

	async execute(documentId: string) {
		const result = await this.transactionManager.execute(
			async (transactionInstance) => {
				// Fetch document
				const workflowDocument =
					await this.worflowDocumentPort.getDocumentById(documentId, transactionInstance);

				if (!workflowDocument.docId) {
					throw new ApplicationError(
						ApplicationErrorEnum.DOCUMENT_NOT_FOUND,
						{
							message: `Document with id ${documentId} doesn't exist.`,
						},
					);
				}

				//  Fetch policy steps
				const workflowSteps =
					await this.workflowPolicyPort.getApprovalSteps(documentId, transactionInstance);

				if (!workflowSteps || workflowSteps.length === 0) {
					throw new ApplicationError(
						ApplicationErrorEnum.POLICY_NOT_FOUND,
						{
							message:
								"No workflow policy defined for this document",
						},
					);
				}

				// Prevent duplicate workflow
				const existingInstance =
					await this.workflowRepository.getInstanceByDocumentId(
						documentId,
                        transactionInstance
					);

				if (existingInstance) {
					throw new ApplicationError(ApplicationErrorEnum.CONFLICT, {
						message: "Workflow already started for this document",
					});
				}

				// Create workflow instance
				const workflowInstance = this.workflowEngine.start(
					"WRKFLOW-" + this.idGenerator.generate(),
					documentId,
				);

				// Activate only first step
				const firstStep = workflowSteps[0]!;

				// Resolve approvers
				const userIds = await this.approverResolverService.resolve(
					workflowDocument,
					firstStep.role,
					firstStep.resolutionStrategy,
				);

				if (!userIds || userIds.length === 0) {
					throw new ApplicationError(
						ApplicationErrorEnum.APPROVER_NOT_FOUND,
						{
							message:
								"No approvers resolved for first workflow step",
						},
					);
				}

				// Create tasks
				const tasks = this.workflowEngine.createTasks(
					workflowInstance.id,
					firstStep,
					userIds,
				);

				// persist everything
				await this.workflowRepository.saveInstance(workflowInstance, transactionInstance);
				await this.workflowRepository.saveTasks(tasks, transactionInstance);

				await this.workflowEventsPort.wrkflowAssigned({
					workflowInstanceId: workflowInstance.id,
					stepOrder: firstStep.stepOrder,
					role: firstStep.role,
					assignedTo: userIds,
					documentId,
				});

                return { instanceId: workflowInstance.id, tasksLength: tasks.length}
			},
		);

		// audit
		// await this.auditPort.log({
		// 	type: "WORKFLOW_STARTED",
		// 	actorId: doc.ownerId,
		// 	subjectId: documentId,
		// 	payload: {
		// 		workflowInstanceId: workflowInstance.id,
		// 		firstStep: firstStep.stepOrder,
		// 		assignedTo: userIds
		// 	}
		// });

		return {
			workflowInstanceId: result.instanceId,
			tasksCreated: result.tasksLength
		};
	}
}

export default StartWorkflowUseCase;
