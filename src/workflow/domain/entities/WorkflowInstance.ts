import { WorkflowStatus } from "../enum/WorkflowStatus.enum.js";

interface WorkflowInstancePayload {
	id: string;
	documentId: string;
	currentStep: number;
	status: WorkflowStatus;
	createdAt?: Date;
}

// this tracks document progress
class WorkflowInstance {
	readonly id: string;
	readonly documentId: string;
	currentStep: number;
	status: WorkflowStatus;
	createdAt?: Date;

	constructor(payload: WorkflowInstancePayload) {
		this.id = payload.id;
		this.documentId = payload.documentId;
		this.currentStep = payload.currentStep;
		this.status = payload.status;

		this.createdAt = payload.createdAt ?? new Date();
	}

	moveToStep(stepOrder: number) {
		if (this.status !== WorkflowStatus.IN_PROGRESS) {
			throw new Error("Cannot move step on completed/rejected workflow");
		}

		if (stepOrder <= this.currentStep) {
			throw new Error("Cannot move backwards or to same step");
		}

		this.currentStep = stepOrder;
	}

	complete() {
		this.status = WorkflowStatus.COMPLETED;
	}

	reject() {
		this.status = WorkflowStatus.REJECTED;
	}
}

export default WorkflowInstance;
