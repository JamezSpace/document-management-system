interface StaffActivationFailurePayload {
	id: string;
	staffId: string;
	inviteId: string;
	failureStage: string;
	failureReason: string;
	resolved?: boolean;
	retryCount?: number;
	firstFailedAt: Date;
	lastFailedAt: Date;
	resolvedAt?: Date | null;
}

class StaffActivationFailure {
	readonly id: string;
	readonly staffId: string;
	readonly inviteId: string;
	readonly failureStage: string;
	readonly failureReason: string;
	readonly resolved: boolean;
	readonly retryCount: number;
	readonly firstFailedAt: Date;
	readonly lastFailedAt: Date;
	readonly resolvedAt: Date | null;

	constructor(payload: StaffActivationFailurePayload) {
		this.id = payload.id;
		this.staffId = payload.staffId;
		this.inviteId = payload.inviteId;
		this.failureStage = payload.failureStage;
		this.failureReason = payload.failureReason;
		this.resolved = payload.resolved ?? false;
		this.retryCount = payload.retryCount ?? 0;
		this.firstFailedAt = payload.firstFailedAt;
		this.lastFailedAt = payload.lastFailedAt;
		this.resolvedAt = payload.resolvedAt ?? null;
	}

	markResolved(resolvedAt: Date = new Date()): StaffActivationFailure {
		return new StaffActivationFailure({
			...this,
			resolved: true,
			resolvedAt,
		});
	}
}

export type { StaffActivationFailurePayload };
export default StaffActivationFailure;
