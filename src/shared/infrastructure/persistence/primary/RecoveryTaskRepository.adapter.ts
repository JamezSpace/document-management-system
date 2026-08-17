import type { PostgresDb } from "@fastify/postgres";
import type { RecoveryTaskRepositoryPort } from "../../../application/port/repos/RecoveryTask.port.js";
import type { RecoveryTaskPayload } from "../../../domain/RecoveryTask.js";
import RecoveryTask, {
    RecoveryTaskStatus,
} from "../../../domain/RecoveryTask.js";
import {
    Category,
    GlobalInfrastructureErrors,
} from "../../../errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../errors/InfrastructureError.error.js";
import { mapPostgresError } from "./helpers/mapPostgresError.helper.js";

interface RecoveryTaskRow {
	id: string;
	task_type: string;
	entity_id: string;
	payload: unknown;
	error_message: string;
	status: RecoveryTaskStatus;
	created_at: Date;
	resolved_at?: Date | null;
}

class RecoveryTaskRepositoryAdapter
	implements RecoveryTaskRepositoryPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	private toRecoveryTask(row: any): RecoveryTask {
		return new RecoveryTask({
			id: row.id,
			taskType: row.task_type,
			entityId: row.entity_id,
			payload: row.payload,
			errorMessage: row.error_message,
			status: row.status,
			createdAt: row.created_at,
		});
	}

	private async findRecoveryTaskRowById(
		rcvTaskId: string,
	): Promise<RecoveryTaskRow | null> {
		const query = `
			SELECT id, task_type, entity_id, payload, error_message, status, created_at, resolved_at
			FROM identity.recovery_tasks
			WHERE id = $1
			LIMIT 1
		`;

		const result = await this.dbPool.query(query, [rcvTaskId]);

		return result.rows?.[0] ?? null;
	}

	async save(payload: RecoveryTaskPayload): Promise<RecoveryTask> {
		try {
			const query = `
				INSERT INTO identity.recovery_tasks (
					id,
					task_type,
					entity_id,
					payload,
					error_message,
					status,
					created_at
				)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING id, task_type, entity_id, payload, error_message, status, created_at
			`;

			const result = await this.dbPool.query(query, [
				payload.id,
				payload.taskType,
				payload.entityId,
				payload.payload,
				payload.errorMessage,
				payload.status ?? RecoveryTaskStatus.PENDING,
				payload.createdAt,
			]);

			return this.toRecoveryTask(result.rows[0]);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
				table: postgresError.details?.table,
				column: postgresError.details?.column,
			});
		}
	}

	async findById(rcvTaskId: string): Promise<RecoveryTask | null> {
		try {
			const row = await this.findRecoveryTaskRowById(rcvTaskId);

			if (!row) return null;

			return this.toRecoveryTask(row);
		} catch (error: any) {
			throw new InfrastructureError(
				GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
				{
					category: Category.PERSISTENCE,
					message: error.message,
				},
			);
		}
	}

	async fetchAll(): Promise<RecoveryTask[]> {
		try {
			const query = `
				SELECT id, task_type, entity_id, payload, error_message, status, created_at
				FROM identity.recovery_tasks
				ORDER BY created_at DESC
			`;

			const result = await this.dbPool.query(query);

			return (result.rows ?? []).map((row) => this.toRecoveryTask(row));
		} catch (error: any) {
			throw new InfrastructureError(
				GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
				{
					category: Category.PERSISTENCE,
					message: error.message,
				},
			);
		}
	}

	async updateRecoveryTask(
		rcvTaskId: string,
		changesToMake: Partial<RecoveryTask>,
	): Promise<RecoveryTask> {
		try {
			const existingRecoveryTaskRow = await this.findRecoveryTaskRowById(
				rcvTaskId,
			);

			if (!existingRecoveryTaskRow) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.NOT_FOUND,
					{
						category: Category.PERSISTENCE,
						message: `Recovery task not found: ${rcvTaskId}`,
					},
				);
			}

			const nextTaskType =
				changesToMake.taskType ?? existingRecoveryTaskRow.task_type;
			const nextEntityId =
				changesToMake.entityId ?? existingRecoveryTaskRow.entity_id;
			const nextPayload =
				changesToMake.payload ?? existingRecoveryTaskRow.payload;
			const nextErrorMessage =
				changesToMake.errorMessage ?? existingRecoveryTaskRow.error_message;
			const nextStatus = changesToMake.status ?? existingRecoveryTaskRow.status;
			const nextCreatedAt =
				changesToMake.createdAt ?? existingRecoveryTaskRow.created_at;

			const resolvedAt =
				changesToMake.status !== undefined
					? nextStatus === RecoveryTaskStatus.RESOLVED
						? new Date()
						: null
					: existingRecoveryTaskRow.resolved_at ?? null;

			const query = `
				UPDATE identity.recovery_tasks
				SET task_type = $2,
					entity_id = $3,
					payload = $4,
					error_message = $5,
					status = $6,
					created_at = $7,
					resolved_at = $8
				WHERE id = $1
				RETURNING id, task_type, entity_id, payload, error_message, status, created_at
			`;

			const result = await this.dbPool.query(query, [
				rcvTaskId,
				nextTaskType,
				nextEntityId,
				nextPayload,
				nextErrorMessage,
				nextStatus,
				nextCreatedAt,
				resolvedAt,
			]);

			return this.toRecoveryTask(result.rows[0]);
		} catch (error: any) {
			if (error instanceof InfrastructureError) throw error;

			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
				table: postgresError.details?.table,
				column: postgresError.details?.column,
			});
		}
	}
}

export default RecoveryTaskRepositoryAdapter;
