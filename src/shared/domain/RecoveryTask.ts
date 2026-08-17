enum RecoveryTaskType {
	STAFF_CREATION = "staff_creation",
	STAFF_ACTIVATION = "staff_activation",
	EMAIL_DELIVERY = "email_delivery",
}

enum RecoveryTaskStatus {
	PENDING = "pending",
	RESOLVED = "resolved",
	FAILED = "failed",
}

interface RecoveryTaskPayload {
	id: string;
	taskType: RecoveryTaskType;
	entityId: string;
	payload: unknown;
	errorMessage: string;
	status?: RecoveryTaskStatus;
	createdAt: Date;
}

class RecoveryTask {
	id: string;
	taskType: RecoveryTaskType;
	entityId: string;
	payload: unknown;
	errorMessage: string;
	status: RecoveryTaskStatus;
	createdAt: Date;

	constructor(payload: RecoveryTaskPayload) {
		this.id = payload.id;
		this.taskType = payload.taskType;
		this.entityId = payload.entityId;
		this.payload = payload.payload;
		this.errorMessage = payload.errorMessage;
		this.status = payload.status ? payload.status : RecoveryTaskStatus.PENDING;
		this.createdAt = payload.createdAt;
	}
}

export default RecoveryTask;
export type {RecoveryTaskPayload};
export { RecoveryTaskStatus, RecoveryTaskType };
