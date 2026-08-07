import { strict as assert } from "node:assert";
import { test } from "node:test";

import type { WorkflowDocumentPort } from "../../src/shared/application/port/intersubsystem/WorkflowDocument.port.js";
import type { WorkflowPolicyPort } from "../../src/shared/application/port/intersubsystem/WorkflowPolicy.port.js";
import type { TransactionManager } from "../../src/shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../src/shared/errors/ApplicationError.error.js";
import DomainError from "../../src/shared/errors/DomainError.error.js";
import type { TransactionContext } from "../../src/shared/infrastructure/persistence/primary/postgres.js";
import ApproveTaskUseCase from "../../src/workflow/application/usecases/ApproveWorkflowTask.usecase.js";
import RejectTaskUseCase from "../../src/workflow/application/usecases/RejectWorkflowTask.usecase.js";
import type { WorkflowRepositoryPort } from "../../src/workflow/application/port/repos/WorkflowRepository.port.js";
import type { ApproverResolverServicePort } from "../../src/workflow/application/port/services/ApproverResolverServicePort.js";
import WorkflowEngine from "../../src/workflow/domain/WorkflowEngine.service.js";
import WorkflowInstance from "../../src/workflow/domain/entities/WorkflowInstance.js";
import WorkflowStep from "../../src/workflow/domain/entities/WorkflowStep.js";
import WorkflowTask from "../../src/workflow/domain/entities/WorkflowTask.js";
import { ResolutionStrategy } from "../../src/workflow/domain/enum/ResolutionStrategy.enum.js";
import { WorkflowStatus } from "../../src/workflow/domain/enum/WorkflowStatus.enum.js";
import { WorkflowTaskStatus } from "../../src/workflow/domain/enum/WorkflowTaskStatus.enum.js";

class PassthroughTransactionManager implements TransactionManager {
	private readonly transaction = {
		client: {} as TransactionContext["client"],
	};

	execute<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
		return work(this.transaction);
	}
}

function cloneTask(task: WorkflowTask): WorkflowTask {
	return new WorkflowTask({
		id: task.id,
		workflowInstanceId: task.workflowInstanceId,
		stepOrder: task.stepOrder,
		assignedTo: task.assignedTo,
		minuteId: task.getMinuteId(),
		role: task.role,
		status: task.getStatus(),
		createdAt: task.createdAt,
	});
}

function cloneInstance(instance: WorkflowInstance): WorkflowInstance {
	return new WorkflowInstance({
		id: instance.id,
		documentId: instance.documentId,
		currentStep: instance.currentStep,
		status: instance.status,
		createdAt: instance.createdAt ?? new Date(0),
	});
}

/**
 * Mimics a real persistence adapter: fetched entities are detached snapshots, so
 * mutating one does not change later reads until updateTask/updateInstance runs.
 */
class SnapshotWorkflowRepository implements WorkflowRepositoryPort {
	private readonly instances = new Map<string, WorkflowInstance>();
	private readonly tasks = new Map<string, WorkflowTask>();

	constructor(instances: WorkflowInstance[], tasks: WorkflowTask[]) {
		for (const instance of instances) {
			this.instances.set(instance.id, cloneInstance(instance));
		}
		for (const task of tasks) {
			this.tasks.set(task.id, cloneTask(task));
		}
	}

	async saveInstance(instance: WorkflowInstance): Promise<void> {
		this.instances.set(instance.id, cloneInstance(instance));
	}

	async getInstanceById(instanceId: string): Promise<WorkflowInstance | null> {
		const instance = this.instances.get(instanceId);
		return instance ? cloneInstance(instance) : null;
	}

	async getInstanceByDocumentId(documentId: string): Promise<WorkflowInstance | null> {
		const instance = [...this.instances.values()].find(
			(candidate) => candidate.documentId === documentId,
		);
		return instance ? cloneInstance(instance) : null;
	}

	async updateInstance(instance: WorkflowInstance): Promise<void> {
		this.instances.set(instance.id, cloneInstance(instance));
	}

	async saveTasks(tasks: WorkflowTask[]): Promise<void> {
		for (const task of tasks) {
			this.tasks.set(task.id, cloneTask(task));
		}
	}

	async getTasksByInstanceId(instanceId: string): Promise<WorkflowTask[]> {
		return [...this.tasks.values()]
			.filter((task) => task.workflowInstanceId === instanceId)
			.map(cloneTask);
	}

	async getTasksByStep(
		instanceId: string,
		stepOrder: number,
	): Promise<WorkflowTask[]> {
		return [...this.tasks.values()]
			.filter(
				(task) =>
					task.workflowInstanceId === instanceId &&
					task.stepOrder === stepOrder,
			)
			.map(cloneTask);
	}

	async getTaskById(taskId: string): Promise<WorkflowTask | null> {
		const task = this.tasks.get(taskId);
		return task ? cloneTask(task) : null;
	}

	async updateTask(task: WorkflowTask): Promise<void> {
		this.tasks.set(task.id, cloneTask(task));
	}
}

function workflowInstance(): WorkflowInstance {
	return new WorkflowInstance({
		id: "workflow-1",
		documentId: "document-1",
		currentStep: 1,
		status: WorkflowStatus.IN_PROGRESS,
	});
}

function workflowTask(payload: {
	id: string;
	assignedTo: string;
	status?: WorkflowTaskStatus;
}): WorkflowTask {
	return new WorkflowTask({
		id: payload.id,
		workflowInstanceId: "workflow-1",
		stepOrder: 1,
		assignedTo: payload.assignedTo,
		role: "reviewer",
		status: payload.status ?? WorkflowTaskStatus.PENDING,
	});
}

function approvalDependencies(steps: WorkflowStep[]) {
	let generatedId = 0;
	const policy: WorkflowPolicyPort = {
		getApprovalSteps: async () => steps,
	};
	const documents: WorkflowDocumentPort = {
		getDocumentById: async () => ({
			docId: "document-1",
			owner: {
				id: "owner-1",
				unitId: "unit-1",
				officeId: "office-1",
				designationId: "designation-1",
			},
		}),
	};
	const resolver: ApproverResolverServicePort = {
		resolve: async () => ["director-1"],
	};
	const engine = new WorkflowEngine({
		generate: () => String(++generatedId),
	});

	return { policy, documents, resolver, engine };
}

test("the final approval advances a workflow when repository reads are detached snapshots", async () => {
	const currentTask = workflowTask({ id: "task-current", assignedTo: "staff-1" });
	const priorApproval = workflowTask({
		id: "task-already-approved",
		assignedTo: "staff-2",
		status: WorkflowTaskStatus.APPROVED,
	});
	const repository = new SnapshotWorkflowRepository(
		[workflowInstance()],
		[currentTask, priorApproval],
	);
	const firstStep = new WorkflowStep({
		stepOrder: 1,
		role: "reviewer",
		resolutionStrategy: ResolutionStrategy.ROLE_IN_OFFICE,
	});
	const nextStep = new WorkflowStep({
		stepOrder: 2,
		role: "director",
		resolutionStrategy: ResolutionStrategy.ROLE_IN_UNIT,
	});
	const dependencies = approvalDependencies([firstStep, nextStep]);
	const useCase = new ApproveTaskUseCase(
		repository,
		dependencies.policy,
		dependencies.documents,
		dependencies.engine,
		dependencies.resolver,
		new PassthroughTransactionManager(),
	);

	const result = await useCase.execute("task-current", "staff-1", "minute-1");

	assert.deepEqual(result, {
		message: "Step completed. Workflow advanced.",
		nextStep: 2,
	});
	assert.equal(
		(await repository.getTaskById("task-current"))?.getStatus(),
		WorkflowTaskStatus.APPROVED,
	);
	assert.equal(
		(await repository.getInstanceById("workflow-1"))?.currentStep,
		2,
	);
	const nextTasks = await repository.getTasksByStep("workflow-1", 2);
	assert.equal(nextTasks.length, 1);
	assert.equal(nextTasks[0]?.assignedTo, "director-1");
	assert.equal(nextTasks[0]?.getStatus(), WorkflowTaskStatus.PENDING);
});

test("the approval use case rejects an actor who is not assigned to the task", async () => {
	const repository = new SnapshotWorkflowRepository(
		[workflowInstance()],
		[workflowTask({ id: "task-1", assignedTo: "staff-1" })],
	);
	const dependencies = approvalDependencies([]);
	const useCase = new ApproveTaskUseCase(
		repository,
		dependencies.policy,
		dependencies.documents,
		dependencies.engine,
		dependencies.resolver,
		new PassthroughTransactionManager(),
	);

	await assert.rejects(
		useCase.execute("task-1", "staff-2"),
		(error: unknown) => {
			assert.ok(error instanceof ApplicationError);
			assert.equal(error.errorCode, "user_not_authorized");
			return true;
		},
	);
	assert.equal(
		(await repository.getTaskById("task-1"))?.getStatus(),
		WorkflowTaskStatus.PENDING,
	);
});

test("rejecting a task persists both the task rejection and workflow rejection", async () => {
	const repository = new SnapshotWorkflowRepository(
		[workflowInstance()],
		[workflowTask({ id: "task-1", assignedTo: "staff-1" })],
	);
	const useCase = new RejectTaskUseCase(
		repository,
		new PassthroughTransactionManager(),
	);

	const result = await useCase.execute("task-1", "staff-1", "minute-1");

	assert.deepEqual(result, {
		workflowInstanceId: "workflow-1",
		status: WorkflowStatus.REJECTED,
	});
	assert.equal(
		(await repository.getTaskById("task-1"))?.getStatus(),
		WorkflowTaskStatus.REJECTED,
	);
	assert.equal(
		(await repository.getTaskById("task-1"))?.getMinuteId(),
		"minute-1",
	);
	assert.equal(
		(await repository.getInstanceById("workflow-1"))?.status,
		WorkflowStatus.REJECTED,
	);
});

test("the rejection use case preserves state for an unauthorized actor", async () => {
	const repository = new SnapshotWorkflowRepository(
		[workflowInstance()],
		[workflowTask({ id: "task-1", assignedTo: "staff-1" })],
	);
	const useCase = new RejectTaskUseCase(
		repository,
		new PassthroughTransactionManager(),
	);

	await assert.rejects(
		useCase.execute("task-1", "staff-2", "minute-1"),
		(error: unknown) => {
			assert.ok(error instanceof DomainError);
			assert.equal(error.errorCode, "unauthorised_approval");
			return true;
		},
	);
	assert.equal(
		(await repository.getTaskById("task-1"))?.getStatus(),
		WorkflowTaskStatus.PENDING,
	);
	assert.equal(
		(await repository.getInstanceById("workflow-1"))?.status,
		WorkflowStatus.IN_PROGRESS,
	);
});

test("the rejection use case preserves state when its minute is blank", async () => {
	const repository = new SnapshotWorkflowRepository(
		[workflowInstance()],
		[workflowTask({ id: "task-1", assignedTo: "staff-1" })],
	);
	const useCase = new RejectTaskUseCase(
		repository,
		new PassthroughTransactionManager(),
	);

	await assert.rejects(
		useCase.execute("task-1", "staff-1", "   "),
		(error: unknown) => {
			assert.ok(error instanceof DomainError);
			assert.equal(error.errorCode, "rejection_minute_required");
			return true;
		},
	);
	assert.equal(
		(await repository.getTaskById("task-1"))?.getStatus(),
		WorkflowTaskStatus.PENDING,
	);
	assert.equal(
		(await repository.getInstanceById("workflow-1"))?.status,
		WorkflowStatus.IN_PROGRESS,
	);
});
