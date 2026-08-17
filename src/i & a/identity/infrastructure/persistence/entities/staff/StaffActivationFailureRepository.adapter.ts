import type { PostgresDb } from "@fastify/postgres";
import { Category } from "../../../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { ActivationFailureRepositoryPort, StaffActivationFailureRecordPayload } from "../../../../application/ports/repos/entities/staff/StaffActivationFailureRepository.port.js";
import StaffActivationFailure from "../../../../domain/entities/staff/StaffActivationFailure.js";

class StaffActivationFailureRepositoryAdapter
	implements ActivationFailureRepositoryPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	async recordFailure(
		failure: StaffActivationFailureRecordPayload,
		tx?: TransactionContext,
	): Promise<StaffActivationFailure> {
		try {
			const executor = tx?.client ?? this.dbPool;

			const result = await executor.query(
				`INSERT INTO identity.staff_activation_failures (
					id,
					staff_id,
					invite_id,
					failure_stage,
					failure_reason,
					resolved,
					retry_count,
					first_failed_at,
					last_failed_at,
					resolved_at
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
				RETURNING *`,
				[
					failure.id,
					failure.staffId,
					failure.inviteId,
					failure.failureStage,
					failure.failureReason,
					failure.resolved ?? false,
					failure.retryCount ?? 0,
					failure.firstFailedAt,
					failure.lastFailedAt,
					failure.resolvedAt,
				],
			);

			const row = result.rows[0];

			return new StaffActivationFailure({
				id: row.id,
				staffId: row.staff_id,
				inviteId: row.invite_id,
				failureStage: row.failure_stage,
				failureReason: row.failure_reason,
				resolved: row.resolved,
				retryCount: row.retry_count,
				firstFailedAt: row.first_failed_at,
				lastFailedAt: row.last_failed_at,
				resolvedAt: row.resolved_at,
			});
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}

	async resolveByStaffId(
		staffId: string,
		tx?: TransactionContext,
	): Promise<void> {
		try {
			const executor = tx?.client ?? this.dbPool;

			await executor.query(
				`UPDATE identity.staff_activation_failures
				 SET resolved = TRUE,
				     resolved_at = NOW()
				 WHERE staff_id = $1 AND resolved = FALSE`,
				[staffId],
			);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}
}

export default StaffActivationFailureRepositoryAdapter;
