import type { TransactionContext } from "../../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type StaffActivationFailure from "../../../../../domain/entities/staff/StaffActivationFailure.js";

interface StaffActivationFailureRecordPayload {
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

interface ActivationFailureRepositoryPort {
	recordFailure(
		failure: StaffActivationFailureRecordPayload,
		tx?: TransactionContext,
	): Promise<StaffActivationFailure>;

	resolveByStaffId(
		staffId: string,
		tx?: TransactionContext,
	): Promise<void>;
}

export type { ActivationFailureRepositoryPort, StaffActivationFailureRecordPayload };
