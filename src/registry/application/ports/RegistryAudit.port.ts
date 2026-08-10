import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type { NewAuditEvent } from "../../../audit/application/ports/AuditEventRepository.port.js";

interface RegistryAuditPort {
	append(event: NewAuditEvent, tx: TransactionContext): Promise<void>;
}

export type { RegistryAuditPort };
