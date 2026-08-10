import type { PostgresDb } from "@fastify/postgres";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import {
	Category,
	GlobalInfrastructureErrors,
} from "../../../shared/errors/enum/infrastructure.enum.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type {
	AuditEventFilters,
	AuditEventRepositoryPort,
	AuditVisibility,
	NewAuditEvent,
} from "../../application/ports/AuditEventRepository.port.js";
import AuditEvent from "../../domain/AuditEvent.js";

interface AuditEventRow {
	id: string;
	actor_id: string;
	actor_type: "staff" | "system" | "external";
	capability: string | null;
	action: string;
	event_type: string;
	aggregate_type: string;
	aggregate_id: string;
	office_id: string | null;
	unit_id: string | null;
	outcome: "success" | "denied" | "failed";
	reason: string | null;
	request_id: string | null;
	correlation_id: string | null;
	metadata: Record<string, unknown>;
	occurred_at: Date;
}

class AuditEventRepositoryAdapter implements AuditEventRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async append(event: NewAuditEvent, tx: TransactionContext): Promise<void> {
		try {
			await tx.client.query(
				`
					INSERT INTO audit.events (
						id, actor_id, actor_type, capability, action, event_type,
						aggregate_type, aggregate_id, office_id, unit_id, outcome,
						reason, request_id, correlation_id, metadata, occurred_at
					)
					VALUES (
						$1, $2, $3, $4, $5, $6, $7, $8,
						$9, $10, $11, $12, $13, $14, $15, $16
					)
				`,
				[
					event.id,
					event.actorId,
					event.actorType,
					event.capability ?? null,
					event.action,
					event.eventType,
					event.aggregateType,
					event.aggregateId,
					event.officeId ?? null,
					event.unitId ?? null,
					event.outcome,
					event.reason ?? null,
					event.requestId ?? null,
					event.correlationId ?? null,
					event.metadata ?? {},
					event.occurredAt ?? new Date(),
				],
			);
		} catch (error: unknown) {
			throw this.persistenceError(error);
		}
	}

	async list(
		visibility: AuditVisibility,
		filters: AuditEventFilters,
	): Promise<AuditEvent[]> {
		if (
			!visibility.organization &&
			visibility.unitIds.length === 0 &&
			visibility.officeIds.length === 0
		) {
			return [];
		}

		const conditions: string[] = [];
		const values: unknown[] = [];
		const add = (condition: string, value: unknown) => {
			values.push(value);
			conditions.push(condition.replace("?", `$${values.length}`));
		};

		if (!visibility.organization) {
			const scopeConditions: string[] = [];
			if (visibility.unitIds.length > 0) {
				values.push(visibility.unitIds);
				scopeConditions.push(`unit_id = ANY($${values.length}::varchar[])`);
			}
			if (visibility.officeIds.length > 0) {
				values.push(visibility.officeIds);
				scopeConditions.push(`office_id = ANY($${values.length}::varchar[])`);
			}
			conditions.push(`(${scopeConditions.join(" OR ")})`);
		}

		if (filters.actorId) add("actor_id = ?", filters.actorId);
		if (filters.eventType) add("event_type = ?", filters.eventType);
		if (filters.aggregateType)
			add("aggregate_type = ?", filters.aggregateType);
		if (filters.aggregateId) add("aggregate_id = ?", filters.aggregateId);
		if (filters.officeId) add("office_id = ?", filters.officeId);
		if (filters.unitId) add("unit_id = ?", filters.unitId);
		if (filters.outcome) add("outcome = ?", filters.outcome);
		if (filters.before) add("occurred_at < ?", filters.before);

		values.push(filters.limit);
		const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

		try {
			const result = await this.dbPool.query<AuditEventRow>(
				`
					SELECT *
					FROM audit.events
					${where}
					ORDER BY occurred_at DESC, id DESC
					LIMIT $${values.length};
				`,
				values,
			);

			return result.rows.map((row) => this.toDomain(row));
		} catch (error: unknown) {
			throw this.persistenceError(error);
		}
	}

	private toDomain(row: AuditEventRow): AuditEvent {
		return new AuditEvent({
			id: row.id,
			actorId: row.actor_id,
			actorType: row.actor_type,
			capability: row.capability,
			action: row.action,
			eventType: row.event_type,
			aggregateType: row.aggregate_type,
			aggregateId: row.aggregate_id,
			officeId: row.office_id,
			unitId: row.unit_id,
			outcome: row.outcome,
			reason: row.reason,
			requestId: row.request_id,
			correlationId: row.correlation_id,
			metadata: row.metadata,
			occurredAt: new Date(row.occurred_at),
		});
	}

	private persistenceError(error: unknown): InfrastructureError {
		const message = error instanceof Error ? error.message : String(error);
		return new InfrastructureError(
			GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
			{
				category: Category.PERSISTENCE,
				message,
				cause: error,
			},
		);
	}
}

export default AuditEventRepositoryAdapter;
