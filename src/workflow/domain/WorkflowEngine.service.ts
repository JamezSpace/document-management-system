import type { IdGeneratorPort } from "../../shared/application/port/services/IdGenerator.port.js";
import WorkflowInstance from "./entities/WorkflowInstance.js";
import WorkflowStep from "./entities/WorkflowStep.js";
import WorkflowTask from "./entities/WorkflowTask.js";
import { WorkflowStatus } from "./enum/WorkflowStatus.enum.js";
import { WorkflowTaskStatus } from "./enum/WorkflowTaskStatus.enum.js";

class WorkflowEngine {
	constructor(private readonly idGenerator: IdGeneratorPort) {}

	start(instanceId: string, documentId: string): WorkflowInstance {
		return new WorkflowInstance({
			id: instanceId,
			documentId,
			currentStep: 0,
			status: WorkflowStatus.IN_PROGRESS,
		});
	}

	createTasks(
		instanceId: string,
		step: WorkflowStep,
		userIds: string[],
	): WorkflowTask[] {
		return userIds.map((userId) => {
			return new WorkflowTask({
				id: "WRKFLOW-TASK-" + this.idGenerator.generate(),
				workflowInstanceId: instanceId,
				stepOrder: step.stepOrder,
				assignedTo: userId,
				minuteId: null,
				role: step.role,
				status: WorkflowTaskStatus.PENDING,
			});
		});
	}

	getNextStep(
		steps: WorkflowStep[],
		currentStepOrder: number,
	): WorkflowStep | null {
		if (!steps || steps.length === 0) return null;

		// ensure steps are ordered (defensive)
		const sortedSteps = [...steps].sort(
			(a, b) => a.stepOrder - b.stepOrder,
		);

		// find first step greater than current
		const nextStep = sortedSteps.find(
			(step) => step.stepOrder > currentStepOrder,
		);

		return nextStep ?? null;
	}

	isStepComplete(tasks: WorkflowTask[]): boolean {
		return tasks.length > 0 && tasks.every(
			(task) => task.getStatus() === WorkflowTaskStatus.APPROVED,
		);
	}

	isTerminalStep(workflowStepsNumber: number, currentStep: number): boolean {
		return currentStep === workflowStepsNumber;
	}
}

export default WorkflowEngine;
