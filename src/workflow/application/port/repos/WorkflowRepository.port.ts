import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type WorkflowInstance from "../../../domain/entities/WorkflowInstance.js";
import type WorkflowTask from "../../../domain/entities/WorkflowTask.js";

interface WorkflowRepositoryPort {
	saveInstance(
		instance: WorkflowInstance,
		tx?: TransactionContext,
	): Promise<void>;

	getInstanceById(
		instanceId: string,
		tx?: TransactionContext,
		options?: { forUpdate?: boolean },
	): Promise<WorkflowInstance | null>;

	getInstanceByDocumentId(
		documentId: string,
		tx?: TransactionContext,
	): Promise<WorkflowInstance | null>;

	updateInstance(
		instance: WorkflowInstance,
		tx?: TransactionContext,
	): Promise<void>;

	saveTasks(tasks: WorkflowTask[], tx?: TransactionContext): Promise<void>;

	getTasksByInstanceId(
		instanceId: string,
		tx?: TransactionContext,
	): Promise<WorkflowTask[]>;

	getTasksByStep(
		instanceId: string,
		stepOrder: number,
		tx?: TransactionContext,
	): Promise<WorkflowTask[]>;

	getTaskById(
		taskId: string,
		tx?: TransactionContext,
	): Promise<WorkflowTask | null>;

	updateTask(task: WorkflowTask, tx?: TransactionContext): Promise<void>;
}

export type { WorkflowRepositoryPort };
