type AuditActorType = "staff" | "system" | "external";
type AuditOutcome = "success" | "denied" | "failed";

interface AuditEventPayload {
	id: string;
	actorId: string;
	actorType: AuditActorType;
	capability?: string | null;
	action: string;
	eventType: string;
	aggregateType: string;
	aggregateId: string;
	officeId?: string | null;
	unitId?: string | null;
	outcome: AuditOutcome;
	reason?: string | null;
	requestId?: string | null;
	correlationId?: string | null;
	metadata?: Record<string, unknown>;
	occurredAt?: Date;
}

class AuditEvent {
	readonly id: string;
	readonly actorId: string;
	readonly actorType: AuditActorType;
	readonly capability: string | null;
	readonly action: string;
	readonly eventType: string;
	readonly aggregateType: string;
	readonly aggregateId: string;
	readonly officeId: string | null;
	readonly unitId: string | null;
	readonly outcome: AuditOutcome;
	readonly reason: string | null;
	readonly requestId: string | null;
	readonly correlationId: string | null;
	readonly metadata: Record<string, unknown>;
	readonly occurredAt: Date;

	constructor(payload: AuditEventPayload) {
		this.id = payload.id;
		this.actorId = payload.actorId;
		this.actorType = payload.actorType;
		this.capability = payload.capability ?? null;
		this.action = payload.action;
		this.eventType = payload.eventType;
		this.aggregateType = payload.aggregateType;
		this.aggregateId = payload.aggregateId;
		this.officeId = payload.officeId ?? null;
		this.unitId = payload.unitId ?? null;
		this.outcome = payload.outcome;
		this.reason = payload.reason ?? null;
		this.requestId = payload.requestId ?? null;
		this.correlationId = payload.correlationId ?? null;
		this.metadata = payload.metadata ?? {};
		this.occurredAt = payload.occurredAt ?? new Date();
	}
}

export default AuditEvent;
export type { AuditActorType, AuditEventPayload, AuditOutcome };
