import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type AuditEvent from "../../domain/AuditEvent.js";
import type { AuditEventPayload } from "../../domain/AuditEvent.js";

type NewAuditEvent = AuditEventPayload;

interface AuditVisibility {
	organization: boolean;
	unitIds: string[];
	officeIds: string[];
}

interface AuditEventFilters {
	actorId?: string;
	eventType?: string;
	aggregateType?: string;
	aggregateId?: string;
	officeId?: string;
	unitId?: string;
	outcome?: "success" | "denied" | "failed";
	before?: Date;
	limit: number;
}

interface AuditEventRepositoryPort {
	append(
		event: NewAuditEvent,
		tx: TransactionContext,
	): Promise<void>;

	list(
		visibility: AuditVisibility,
		filters: AuditEventFilters,
	): Promise<AuditEvent[]>;
}

export type {
	AuditEventFilters,
	AuditEventRepositoryPort,
	AuditVisibility,
	NewAuditEvent,
};
